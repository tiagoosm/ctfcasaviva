-- Ranking backend for the CTF.
--
-- The browser never writes to these tables. It can only call the ctf_* functions
-- granted at the bottom of this file, and the server is the one that validates
-- answers, measures time and computes scores. A client can therefore not submit
-- an arbitrary score, time or error count.

create table public.ctf_challenges (
  id text primary key,
  ord int not null unique,
  max_points int not null check (max_points > 0),
  fast_seconds int not null check (fast_seconds > 0),
  slow_seconds int not null,
  answer_hash text not null,
  check (slow_seconds > fast_seconds)
);

create table public.ctf_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  class_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int,
  total_seconds int,
  errors int,
  hints int
);

create table public.ctf_run_challenges (
  run_id uuid not null references public.ctf_runs (id) on delete cascade,
  challenge_id text not null references public.ctf_challenges (id),
  entered_at timestamptz not null default now(),
  solved_at timestamptz,
  wrong int not null default 0,
  hint_used boolean not null default false,
  seconds int,
  score int,
  primary key (run_id, challenge_id)
);

create index ctf_runs_finished_idx on public.ctf_runs (score desc, total_seconds)
  where finished_at is not null;

-- Row level security with no policies: no direct access through the API
alter table public.ctf_challenges enable row level security;
alter table public.ctf_runs enable row level security;
alter table public.ctf_run_challenges enable row level security;

-- Same salted hashes the client uses (sha256 of "<id>:<normalized answer>")
insert into public.ctf_challenges (id, ord, max_points, fast_seconds, slow_seconds, answer_hash) values
  ('briefing',     1, 100,  60, 300, '6ce4f9112a99d646418c98daa051fdbbe9f452b6a934308fd5109f6ea888224a'),
  ('gallery',      2, 200, 120, 600, '3c59defc470aed151f067e24c11dbac32987a0e1939b5bbe62e20a43130bd40d'),
  ('sequence',     3, 200, 120, 600, 'c98a6251170b6960afa7cf5dead713a1d2042d6c557b2c3a581bccd35ea2c4ea'),
  ('interception', 4, 200, 180, 720, 'ee0cef5a78e7c6e17625d7cc4caec4888fdbcaa43b5e2da4b61a17d7f5e4d452'),
  ('vault',        5, 300, 240, 900, '457ed97614e3e0c5bb706a03007bbc60c0dd5ada44451e0002627323309d45e5');

-- Mirrors normalizeAnswer() in src/utils/answers.js
create function public.ctf_normalize(p_answer text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(
    translate(
      lower(left(coalesce(p_answer, ''), 120)),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ),
    '\s+', '', 'g'
  );
$$;

-- Mirrors computeScore() in src/game/scoring.js:
-- 70% of the challenge for solving it, up to 30% as a speed bonus that decays
-- linearly between fast_seconds and slow_seconds, -10 per wrong answer (at most
-- five are charged), -25 for the hint, never below zero.
create function public.ctf_score(
  p_max int, p_fast int, p_slow int, p_seconds int, p_wrong int, p_hint boolean
)
returns int language sql immutable set search_path = '' as $$
  select greatest(
    0,
    round(p_max * 0.7)::int
      + case
          when p_seconds <= p_fast then p_max - round(p_max * 0.7)::int
          when p_seconds >= p_slow then 0
          else round(
            (p_max - round(p_max * 0.7)) * (p_slow - p_seconds)::numeric / (p_slow - p_fast)
          )::int
        end
      - least(greatest(p_wrong, 0), 5) * 10
      - case when p_hint then 25 else 0 end
  );
$$;

-- Internal: makes sure the challenge is open for this run and has a start time.
-- When the client skipped the "enter" call, the clock is backdated to the moment
-- the previous challenge was solved, so skipping it can never shorten the time.
create function public.ctf_touch(p_run uuid, p_challenge text, p_backdate boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_run public.ctf_runs;
  v_challenge public.ctf_challenges;
  v_previous timestamptz;
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

  insert into public.ctf_run_challenges (run_id, challenge_id, entered_at)
  values (
    p_run,
    p_challenge,
    case when p_backdate then coalesce(v_previous, v_run.started_at) else now() end
  )
  on conflict do nothing;
end;
$$;

create function public.ctf_start(p_name text, p_class text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := left(btrim(regexp_replace(coalesce(p_class, ''), '\s+', ' ', 'g')), 20);
  v_id uuid;
begin
  if v_name = '' or v_class = '' then raise exception 'name and class are required'; end if;
  insert into public.ctf_runs (name, class_name) values (v_name, v_class) returning id into v_id;
  return v_id;
end;
$$;

-- Starts the clock of a challenge. Calling it again does not restart it.
create function public.ctf_enter(p_run uuid, p_challenge text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.ctf_touch(p_run, p_challenge, false);
end;
$$;

create function public.ctf_hint(p_run uuid, p_challenge text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.ctf_touch(p_run, p_challenge, true);
  update public.ctf_run_challenges
  set hint_used = true
  where run_id = p_run and challenge_id = p_challenge and solved_at is null;
end;
$$;

create function public.ctf_submit(p_run uuid, p_challenge text, p_answer text)
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

  v_seconds := greatest(0, floor(extract(epoch from now() - v_row.entered_at)))::int;
  v_score := public.ctf_score(
    v_challenge.max_points, v_challenge.fast_seconds, v_challenge.slow_seconds,
    v_seconds, v_row.wrong, v_row.hint_used
  );

  update public.ctf_run_challenges
  set solved_at = now(), seconds = v_seconds, score = v_score
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

-- One row per participant (their best finished run), best first.
-- Ties on score are broken by the shortest total time.
create function public.ctf_ranked()
returns table (run_id uuid, place int, name text, class_name text, score int, total_seconds int)
language sql stable security definer set search_path = '' as $$
  with best as (
    select distinct on (lower(r.name), lower(r.class_name))
      r.id, r.name, r.class_name, r.score, r.total_seconds, r.finished_at
    from public.ctf_runs r
    where r.finished_at is not null
    order by lower(r.name), lower(r.class_name), r.score desc, r.total_seconds, r.finished_at
  )
  select b.id,
         row_number() over (order by b.score desc, b.total_seconds, b.finished_at)::int,
         b.name, b.class_name, b.score, b.total_seconds
  from best b;
$$;

create function public.ctf_ranking(p_limit int default 20)
returns table (place int, name text, class_name text, score int, total_seconds int)
language sql stable security definer set search_path = '' as $$
  select k.place, k.name, k.class_name, k.score, k.total_seconds
  from public.ctf_ranked() k
  order by k.place
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

-- Final result of a run, with the participant's place in the ranking
create function public.ctf_result(p_run uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'name', r.name,
    'class_name', r.class_name,
    'score', r.score,
    'total_seconds', r.total_seconds,
    'errors', r.errors,
    'hints', r.hints,
    'finished_at', r.finished_at,
    'place', (
      select k.place
      from public.ctf_ranked() k
      where lower(k.name) = lower(r.name) and lower(k.class_name) = lower(r.class_name)
    )
  )
  from public.ctf_runs r
  where r.id = p_run and r.finished_at is not null;
$$;

-- Only the public entry points are callable through the API
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.ctf_start(text, text) to anon, authenticated;
grant execute on function public.ctf_enter(uuid, text) to anon, authenticated;
grant execute on function public.ctf_hint(uuid, text) to anon, authenticated;
grant execute on function public.ctf_submit(uuid, text, text) to anon, authenticated;
grant execute on function public.ctf_ranking(int) to anon, authenticated;
grant execute on function public.ctf_result(uuid) to anon, authenticated;
