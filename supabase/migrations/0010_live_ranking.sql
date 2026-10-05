-- The ranking lists every player who has started, not only those who finished.
--
-- It is built from the same records as everything else: a completed attempt
-- uses its frozen official result, an attempt in progress uses the points and
-- time saved so far, so the ranking follows each player as they play. Ties are
-- broken by the shortest time, then by name. Hidden attempts stay out.
--
-- The ranking place is no longer part of an attempt's state: the certificate
-- does not show it, so it is not computed for it either.

drop function public.ctf_ranking(int);

-- Snapshot without the ranking place (otherwise unchanged from 0007)
create or replace function public.ctf_snapshot(p_run uuid)
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

drop function public.ctf_ranked();

create function public.ctf_ranked()
returns table (
  run_id uuid, place int, name text, class_name text,
  score int, total_seconds int, completed boolean
)
language sql stable security definer set search_path = '' as $$
  with current_totals as (
    select r.id,
           r.name,
           r.class_name,
           r.finished_at is not null as completed,
           -- Official result once completed, points and time so far otherwise
           coalesce(r.score, t.score) as score,
           coalesce(r.total_seconds, t.seconds) as total_seconds
    from public.ctf_runs r
    cross join lateral (
      select coalesce(sum(rc.score), 0)::int as score,
             coalesce(sum(public.ctf_active_seconds(rc)), 0)::int as seconds
      from public.ctf_run_challenges rc
      where rc.run_id = r.id
    ) t
    where not r.hidden
  )
  select c.id,
         row_number() over (order by c.score desc, c.total_seconds, c.name, c.id)::int,
         c.name, c.class_name, c.score, c.total_seconds, c.completed
  from current_totals c;
$$;

create function public.ctf_ranking(p_limit int default 20)
returns table (place int, name text, class_name text, score int, total_seconds int, completed boolean)
language sql stable security definer set search_path = '' as $$
  select k.place, k.name, k.class_name, k.score, k.total_seconds, k.completed
  from public.ctf_ranked() k
  order by k.place
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke execute on function public.ctf_ranked(), public.ctf_ranking(int) from public, anon, authenticated;
grant execute on function public.ctf_ranking(int) to anon, authenticated;
