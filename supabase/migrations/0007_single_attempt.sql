-- One player = one official attempt = one score in the ranking.
--
-- The attempt is created when the player starts (name + class), lives in the
-- database from that moment and is the source of truth for progress, score and
-- completion. Coming back with the same name and class, from any browser or
-- device, resumes it. Once completed it cannot be replayed; only an
-- administrator can reset it (by deleting it).

-- Comparison key for names: case, accents and extra spaces are ignored.
-- The name as typed is kept for display.
create function public.ctf_name_key(p_name text)
returns text language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(
    translate(
      lower(coalesce(p_name, '')),
      'áàâãäåéèêëíìîïóòôõöúùûüçñýÿ',
      'aaaaaaeeeeiiiiooooouuuucnyy'
    ),
    '\s+', ' ', 'g'
  ));
$$;

-- Keep a single attempt per player before enforcing it: a finished one wins,
-- then the best score, then the most recent
delete from public.ctf_runs r
using (
  select id,
         row_number() over (
           partition by public.ctf_name_key(name), upper(btrim(class_name))
           order by (finished_at is not null) desc, score desc nulls last,
                    total_seconds nulls last, started_at desc
         ) as rn
  from public.ctf_runs
) d
where d.id = r.id and d.rn > 1;

alter table public.ctf_runs
  add column name_key text generated always as (public.ctf_name_key(name)) stored,
  add column class_key text generated always as (upper(btrim(class_name))) stored,
  add column status text generated always as (
    case when finished_at is null then 'in_progress' else 'completed' end
  ) stored;

create unique index ctf_runs_player_key on public.ctf_runs (name_key, class_key);

alter table public.ctf_run_challenges
  -- Last time the client was seen inside the challenge (heartbeat)
  add column last_seen timestamptz,
  -- Id of the last answer processed, so a retried request is not charged twice
  add column last_action uuid;

update public.ctf_run_challenges set last_seen = coalesce(resumed_at, paused_at, entered_at);

-- Attempts are never dropped by the player any more
drop function public.ctf_abandon(uuid);
drop function public.ctf_result(uuid);

-- Active seconds of a challenge so far (final once it is solved). A clock whose
-- client stopped reporting (closed tab, lost connection) only counts up to the
-- last time it was seen.
create or replace function public.ctf_active_seconds(p_row public.ctf_run_challenges)
returns int language sql stable set search_path = '' as $$
  select coalesce(
    p_row.seconds,
    floor(extract(epoch from
      p_row.active + case
        when p_row.resumed_at is null then interval '0'
        when p_row.last_seen < now() - interval '90 seconds'
          then greatest(p_row.last_seen - p_row.resumed_at, interval '0')
        else now() - p_row.resumed_at
      end
    ))::int
  );
$$;

-- The ranking: completed attempts only, one per player by construction
create or replace function public.ctf_ranked()
returns table (run_id uuid, place int, name text, class_name text, score int, total_seconds int)
language sql stable security definer set search_path = '' as $$
  select r.id,
         row_number() over (order by r.score desc, r.total_seconds, r.finished_at)::int,
         r.name, r.class_name, r.score, r.total_seconds
  from public.ctf_runs r
  where r.finished_at is not null and not r.hidden;
$$;

-- Internal: everything the client needs to show (or resume) an attempt
create function public.ctf_snapshot(p_run uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'class_name', r.class_name,
    'status', r.status,
    'started_at', r.started_at,
    'finished_at', r.finished_at,
    'score', coalesce(r.score, t.score),
    'total_seconds', coalesce(r.total_seconds, t.seconds),
    'errors', t.errors,
    'hints', t.hints,
    'place', case when r.finished_at is not null then (
      select k.place from public.ctf_ranked() k where k.run_id = r.id
    ) end,
    'challenges', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'solved_at', rc.solved_at,
        'wrong', coalesce(rc.wrong, 0),
        'hint_used', coalesce(rc.hint_used, false),
        'seconds', case when rc.run_id is null then 0 else public.ctf_active_seconds(rc) end,
        'score', rc.score
      ) order by c.ord), '[]'::jsonb)
      from public.ctf_challenges c
      left join public.ctf_run_challenges rc on rc.challenge_id = c.id and rc.run_id = r.id
    )
  )
  from public.ctf_runs r
  cross join lateral (
    select coalesce(sum(rc.score), 0)::int as score,
           coalesce(sum(public.ctf_active_seconds(rc)), 0)::int as seconds,
           coalesce(sum(rc.wrong), 0)::int as errors,
           (count(*) filter (where rc.hint_used))::int as hints
    from public.ctf_run_challenges rc
    where rc.run_id = r.id
  ) t
  where r.id = p_run;
$$;

-- Starts the attempt of a player, or returns the one that already exists
drop function public.ctf_start(text, text);

create function public.ctf_start(p_name text, p_class text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := upper(btrim(coalesce(p_class, '')));
  v_id uuid;
begin
  if public.ctf_name_key(v_name) = '' then raise exception 'name is required'; end if;
  if not public.ctf_valid_class(v_class) then raise exception 'invalid class'; end if;

  -- The unique key makes this safe against double clicks and parallel requests
  insert into public.ctf_runs (name, class_name) values (v_name, v_class)
  on conflict (name_key, class_key) do nothing;

  select id into v_id
  from public.ctf_runs
  where name_key = public.ctf_name_key(v_name) and class_key = v_class;

  return public.ctf_snapshot(v_id);
end;
$$;

-- Current state of an attempt; null when it no longer exists (reset by an admin)
create function public.ctf_state(p_run uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select public.ctf_snapshot(p_run);
$$;

create or replace function public.ctf_touch(p_run uuid, p_challenge text, p_backdate boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_run public.ctf_runs;
  v_challenge public.ctf_challenges;
  v_previous timestamptz;
  v_start timestamptz;
begin
  select * into v_run from public.ctf_runs where id = p_run for update;
  if not found then raise exception 'run not found'; end if;
  if v_run.finished_at is not null then raise exception 'run finished'; end if;

  select * into v_challenge from public.ctf_challenges where id = p_challenge;
  if not found then raise exception 'challenge not found'; end if;

  if exists (
    select 1
    from public.ctf_challenges c
    left join public.ctf_run_challenges rc on rc.challenge_id = c.id and rc.run_id = p_run
    where c.ord < v_challenge.ord and rc.solved_at is null
  ) then
    raise exception 'challenge locked';
  end if;

  select max(solved_at) into v_previous from public.ctf_run_challenges where run_id = p_run;
  v_start := case when p_backdate then coalesce(v_previous, v_run.started_at) else now() end;

  insert into public.ctf_run_challenges (run_id, challenge_id, entered_at, resumed_at, last_seen)
  values (p_run, p_challenge, v_start, v_start, now())
  on conflict do nothing;

  -- A clock left running by a client that went away is closed at the moment it
  -- was last seen, so the time away is not counted
  update public.ctf_run_challenges
  set active = active + greatest(last_seen - resumed_at, interval '0'),
      resumed_at = null,
      paused_at = null
  where run_id = p_run and challenge_id = p_challenge
    and solved_at is null and resumed_at is not null
    and last_seen < now() - interval '90 seconds';

  -- Resume a paused clock. Calls that are not an explicit "enter" count the
  -- paused gap, so skipping the enter call can never shorten the time.
  update public.ctf_run_challenges
  set resumed_at = case when p_backdate then coalesce(paused_at, now()) else now() end,
      paused_at = null
  where run_id = p_run and challenge_id = p_challenge
    and solved_at is null and resumed_at is null;

  update public.ctf_run_challenges
  set last_seen = now()
  where run_id = p_run and challenge_id = p_challenge;
end;
$$;

drop function public.ctf_submit(uuid, text, text);

-- p_action identifies one submission: sending it again (a retry after a lost
-- response) does not charge a second wrong answer
create function public.ctf_submit(p_run uuid, p_challenge text, p_answer text, p_action uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_row public.ctf_run_challenges;
  v_challenge public.ctf_challenges;
  v_answer text := public.ctf_normalize(p_answer);
  v_seconds int;
  v_score int;
  v_finished boolean := false;
begin
  if v_answer = '' then return jsonb_build_object('status', 'empty'); end if;

  -- Already solved (including a retry of the answer that completed the attempt)
  select * into v_row
  from public.ctf_run_challenges
  where run_id = p_run and challenge_id = p_challenge;
  if v_row.solved_at is not null then
    return jsonb_build_object(
      'status', 'correct', 'score', v_row.score, 'seconds', v_row.seconds,
      'finished', exists (select 1 from public.ctf_runs where id = p_run and finished_at is not null)
    );
  end if;

  perform public.ctf_touch(p_run, p_challenge, true);

  select * into v_row
  from public.ctf_run_challenges
  where run_id = p_run and challenge_id = p_challenge
  for update;

  select * into v_challenge from public.ctf_challenges where id = p_challenge;

  if encode(sha256(convert_to(p_challenge || ':' || v_answer, 'UTF8')), 'hex') <> v_challenge.answer_hash then
    if p_action is null or v_row.last_action is distinct from p_action then
      update public.ctf_run_challenges
      set wrong = wrong + 1, last_action = p_action
      where run_id = p_run and challenge_id = p_challenge;
    end if;
    return jsonb_build_object('status', 'incorrect');
  end if;

  v_seconds := greatest(
    0, floor(extract(epoch from v_row.active + (now() - v_row.resumed_at)))
  )::int;
  v_score := public.ctf_score(
    v_challenge.max_points, v_challenge.fast_seconds, v_challenge.slow_seconds,
    v_seconds, v_row.wrong, v_row.hint_used
  );

  update public.ctf_run_challenges
  set solved_at = now(), seconds = v_seconds, score = v_score, resumed_at = null
  where run_id = p_run and challenge_id = p_challenge;

  if not exists (
    select 1
    from public.ctf_challenges c
    left join public.ctf_run_challenges rc on rc.challenge_id = c.id and rc.run_id = p_run
    where rc.solved_at is null
  ) then
    -- Completed: the official result is frozen here
    update public.ctf_runs r
    set finished_at = now(),
        score = t.score,
        total_seconds = t.seconds,
        errors = t.errors,
        hints = t.hints
    from (
      select sum(score)::int as score,
             sum(seconds)::int as seconds,
             sum(wrong)::int as errors,
             count(*) filter (where hint_used)::int as hints
      from public.ctf_run_challenges
      where run_id = p_run
    ) t
    where r.id = p_run;
    v_finished := true;
  end if;

  return jsonb_build_object(
    'status', 'correct', 'score', v_score, 'seconds', v_seconds, 'finished', v_finished
  );
end;
$$;

-- Admin: every attempt with its status, current stage and totals so far
drop function public.ctf_admin_players();

create function public.ctf_admin_players()
returns table (
  id uuid, name text, class_name text, status text, current_challenge text,
  started_at timestamptz, finished_at timestamptz, hidden boolean,
  score int, total_seconds int, errors int, hints int, solved int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.ctf_require_admin();
  return query
  select r.id, r.name, r.class_name, r.status,
         (
           select c.id
           from public.ctf_challenges c
           left join public.ctf_run_challenges x on x.challenge_id = c.id and x.run_id = r.id
           where x.solved_at is null
           order by c.ord
           limit 1
         ),
         r.started_at, r.finished_at, r.hidden,
         coalesce(r.score, coalesce(sum(rc.score), 0)::int),
         coalesce(r.total_seconds, coalesce(sum(public.ctf_active_seconds(rc)), 0)::int),
         coalesce(sum(rc.wrong), 0)::int,
         (count(*) filter (where rc.hint_used))::int,
         count(rc.solved_at)::int
  from public.ctf_runs r
  left join public.ctf_run_challenges rc on rc.run_id = r.id
  group by r.id
  order by r.started_at desc
  limit 5000;
end;
$$;

create or replace function public.ctf_admin_update_player(p_run uuid, p_name text, p_class text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := upper(btrim(coalesce(p_class, '')));
begin
  perform public.ctf_require_admin();
  if public.ctf_name_key(v_name) = '' then raise exception 'name is required'; end if;
  if not public.ctf_valid_class(v_class) then raise exception 'invalid class'; end if;
  begin
    update public.ctf_runs set name = v_name, class_name = v_class where id = p_run;
  exception when unique_violation then
    raise exception 'duplicate player' using errcode = '23505';
  end;
  if not found then raise exception 'run not found'; end if;
end;
$$;

revoke execute on function
  public.ctf_name_key(text),
  public.ctf_snapshot(uuid),
  public.ctf_start(text, text),
  public.ctf_state(uuid),
  public.ctf_submit(uuid, text, text, uuid),
  public.ctf_admin_players()
from public, anon, authenticated;

grant execute on function
  public.ctf_start(text, text),
  public.ctf_state(uuid),
  public.ctf_submit(uuid, text, text, uuid)
to anon, authenticated;

grant execute on function public.ctf_admin_players() to authenticated;
