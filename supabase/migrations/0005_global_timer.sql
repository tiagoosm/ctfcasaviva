-- One visible clock for the whole mission.
--
-- The total time of a run is now the time from its start until the last
-- challenge is solved, including the time spent between challenges. It is what
-- players see, what the result records and what breaks ties in the ranking.
--
-- Scoring is unchanged: each challenge still has its own hidden clock (from the
-- first visit until it is solved), and its speed bonus is based on that time.

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

  -- Hidden per-challenge clock: only used for this challenge's speed bonus
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
    -- Last challenge: the mission clock stops here
    update public.ctf_runs r
    set finished_at = now(),
        total_seconds = greatest(0, floor(extract(epoch from now() - r.started_at)))::int,
        score = t.score,
        errors = t.errors,
        hints = t.hints
    from (
      select sum(score)::int as score,
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

-- Admin: finished runs show their final time; runs in progress show the time
-- elapsed since they started
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
         coalesce(r.total_seconds, floor(extract(epoch from now() - r.started_at))::int),
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
    'total_seconds', coalesce(r.total_seconds, floor(extract(epoch from now() - r.started_at))::int),
    'challenges', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'max_points', c.max_points,
        'entered_at', rc.entered_at,
        'solved_at', rc.solved_at,
        'seconds', rc.seconds,
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
