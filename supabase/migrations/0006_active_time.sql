-- Time only counts while the player is inside a challenge.
--
-- Each challenge clock can now be paused: it runs while the challenge page is
-- open and stops when the player leaves to the map, the ranking or anywhere
-- else. The time of a challenge is the sum of those active periods; it decides
-- that challenge's speed bonus, and the total time of a run is the sum of the
-- challenge times.
--
-- Supersedes the "start to finish" total introduced in 0005.

alter table public.ctf_run_challenges
  add column active interval not null default '0',
  add column resumed_at timestamptz,
  add column paused_at timestamptz;

-- Challenges that were open before this change keep running from their first visit
update public.ctf_run_challenges set resumed_at = entered_at where solved_at is null;

-- Internal: makes sure the challenge is open for this run and its clock is running.
-- p_backdate is used by calls that are not an explicit "enter" (answer, hint):
-- if the client skipped the enter call, the gap is counted instead of dropped,
-- so skipping it can never shorten the time.
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

  insert into public.ctf_run_challenges (run_id, challenge_id, entered_at, resumed_at)
  values (p_run, p_challenge, v_start, v_start)
  on conflict do nothing;

  -- Resume a paused clock
  update public.ctf_run_challenges
  set resumed_at = case when p_backdate then coalesce(paused_at, now()) else now() end,
      paused_at = null
  where run_id = p_run and challenge_id = p_challenge
    and solved_at is null and resumed_at is null;
end;
$$;

-- Pauses the clock of a challenge (the player left its page)
create function public.ctf_leave(p_run uuid, p_challenge text)
returns void language sql security definer set search_path = '' as $$
  update public.ctf_run_challenges
  set active = active + (now() - resumed_at),
      resumed_at = null,
      paused_at = now()
  where run_id = p_run and challenge_id = p_challenge
    and solved_at is null and resumed_at is not null;
$$;

create or replace function public.ctf_submit(p_run uuid, p_challenge text, p_answer text)
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

  perform public.ctf_touch(p_run, p_challenge, true);

  select * into v_row
  from public.ctf_run_challenges
  where run_id = p_run and challenge_id = p_challenge
  for update;

  if v_row.solved_at is not null then
    return jsonb_build_object(
      'status', 'correct', 'score', v_row.score, 'seconds', v_row.seconds, 'finished', false
    );
  end if;

  select * into v_challenge from public.ctf_challenges where id = p_challenge;

  if encode(sha256(convert_to(p_challenge || ':' || v_answer, 'UTF8')), 'hex') <> v_challenge.answer_hash then
    update public.ctf_run_challenges
    set wrong = wrong + 1
    where run_id = p_run and challenge_id = p_challenge;
    return jsonb_build_object('status', 'incorrect');
  end if;

  -- Active time in this challenge: past periods plus the one in progress
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

-- Internal: active seconds of a challenge so far (final once it is solved)
create function public.ctf_active_seconds(p_row public.ctf_run_challenges)
returns int language sql stable set search_path = '' as $$
  select coalesce(
    p_row.seconds,
    floor(extract(epoch from
      p_row.active + case when p_row.resumed_at is null then interval '0' else now() - p_row.resumed_at end
    ))::int
  );
$$;

create or replace function public.ctf_admin_players()
returns table (
  id uuid, name text, class_name text, started_at timestamptz, finished_at timestamptz,
  hidden boolean, score int, total_seconds int, errors int, hints int, solved int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.ctf_require_admin();
  return query
  select r.id, r.name, r.class_name, r.started_at, r.finished_at, r.hidden,
         coalesce(sum(rc.score), 0)::int,
         coalesce(sum(public.ctf_active_seconds(rc)), 0)::int,
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

create or replace function public.ctf_admin_player(p_run uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_result jsonb;
begin
  perform public.ctf_require_admin();
  select jsonb_build_object(
    'id', r.id,
    'name', r.name,
    'class_name', r.class_name,
    'started_at', r.started_at,
    'finished_at', r.finished_at,
    'hidden', r.hidden,
    'total_seconds', (
      select coalesce(sum(public.ctf_active_seconds(rc)), 0)::int
      from public.ctf_run_challenges rc
      where rc.run_id = r.id
    ),
    'challenges', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'max_points', c.max_points,
        'entered_at', rc.entered_at,
        'solved_at', rc.solved_at,
        'seconds', case when rc.run_id is not null then public.ctf_active_seconds(rc) end,
        'wrong', coalesce(rc.wrong, 0),
        'hint_used', coalesce(rc.hint_used, false),
        'score', rc.score
      ) order by c.ord), '[]'::jsonb)
      from public.ctf_challenges c
      left join public.ctf_run_challenges rc on rc.challenge_id = c.id and rc.run_id = r.id
    )
  ) into v_result
  from public.ctf_runs r
  where r.id = p_run;
  return v_result;
end;
$$;

revoke execute on function public.ctf_leave(uuid, text) from public;
grant execute on function public.ctf_leave(uuid, text) to anon, authenticated;
revoke execute on function public.ctf_active_seconds(public.ctf_run_challenges)
  from public, anon, authenticated;
