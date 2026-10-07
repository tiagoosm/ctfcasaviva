-- The mission is no longer linear. Challenges are grouped in tiers:
--
--   1. briefing (shown as "Origem")       — required first
--   2. gallery, sequence, interception    — any order
--   3. vault                              — once all of tier 2 is solved
--
-- A challenge opens once every challenge of an earlier tier is solved. The rule
-- lives in ctf_touch, which every player call goes through (enter, hint,
-- answer), so a locked challenge cannot be reached by calling the API directly.
-- `ord` stays as the display order only.

alter table public.ctf_challenges add column tier int;
update public.ctf_challenges set tier = case id
  when 'briefing' then 1
  when 'vault' then 3
  else 2
end;
alter table public.ctf_challenges alter column tier set not null;

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
    where c.tier < v_challenge.tier and rc.solved_at is null
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

-- Admin: the current stage is the unsolved one the player was in most recently
-- (with free order, "the first unsolved one" no longer says where they are)
create or replace function public.ctf_admin_players()
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
           order by x.last_seen desc nulls last, c.ord
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
