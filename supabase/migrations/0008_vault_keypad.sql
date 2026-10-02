-- The final stage is now a vault with a 4-digit combination.
--
-- A combination that short could be found by trying them all, so challenges
-- marked as `throttled` lock for a while after each wrong answer: 3 s, then
-- 15 s from the 5th error and 60 s from the 10th. Answers sent while locked are
-- refused without being checked.
--
-- The new answer hash and the plain-text answer of the vault are set directly in
-- the database, not here: with only 10,000 possibilities a published hash would
-- give the combination away.

alter table public.ctf_challenges add column throttled boolean not null default false;
update public.ctf_challenges set throttled = true where id = 'vault';

alter table public.ctf_run_challenges add column locked_until timestamptz;

create or replace function public.ctf_submit(p_run uuid, p_challenge text, p_answer text, p_action uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_row public.ctf_run_challenges;
  v_challenge public.ctf_challenges;
  v_answer text := public.ctf_normalize(p_answer);
  v_seconds int;
  v_score int;
  v_wait int := 0;
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

  v_wait := greatest(0, ceil(extract(epoch from v_row.locked_until - now())))::int;

  -- A retry of a submission that was already counted
  if p_action is not null and v_row.last_action = p_action then
    return jsonb_build_object('status', 'incorrect', 'wait', coalesce(v_wait, 0));
  end if;

  -- Locked after a wrong answer: nothing is checked, right or wrong
  if coalesce(v_wait, 0) > 0 then
    return jsonb_build_object('status', 'locked', 'wait', v_wait);
  end if;

  if encode(sha256(convert_to(p_challenge || ':' || v_answer, 'UTF8')), 'hex') <> v_challenge.answer_hash then
    v_wait := case
      when not v_challenge.throttled then 0
      when v_row.wrong + 1 >= 10 then 60
      when v_row.wrong + 1 >= 5 then 15
      else 3
    end;
    update public.ctf_run_challenges
    set wrong = wrong + 1,
        last_action = p_action,
        locked_until = case when v_wait > 0 then now() + make_interval(secs => v_wait) end
    where run_id = p_run and challenge_id = p_challenge;
    return jsonb_build_object('status', 'incorrect', 'wait', v_wait);
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
