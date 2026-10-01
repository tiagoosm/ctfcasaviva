-- Admin area.
--
-- Administrators sign in with Supabase Auth (email + password). Being signed in
-- is not enough: every ctf_admin_* function checks that the caller's confirmed
-- email is listed in ctf_admins. Players never sign in and cannot call them.

-- Emails allowed to administer the CTF. Managed from the Supabase dashboard.
create table public.ctf_admins (
  email text primary key
);
alter table public.ctf_admins enable row level security;

-- Plain-text answers, shown only in the admin area. They are filled in directly
-- in the database, never from a migration, so they stay out of the repository.
alter table public.ctf_challenges add column answer text;

-- Lets an admin take a result out of the public ranking without deleting it
alter table public.ctf_runs add column hidden boolean not null default false;

create function public.ctf_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from auth.users u
    join public.ctf_admins a on lower(a.email) = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;

create function public.ctf_require_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ctf_is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

-- The public ranking now skips hidden results
create or replace function public.ctf_ranked()
returns table (run_id uuid, place int, name text, class_name text, score int, total_seconds int)
language sql stable security definer set search_path = '' as $$
  with best as (
    select distinct on (lower(r.name), lower(r.class_name))
      r.id, r.name, r.class_name, r.score, r.total_seconds, r.finished_at
    from public.ctf_runs r
    where r.finished_at is not null and not r.hidden
    order by lower(r.name), lower(r.class_name), r.score desc, r.total_seconds, r.finished_at
  )
  select b.id,
         row_number() over (order by b.score desc, b.total_seconds, b.finished_at)::int,
         b.name, b.class_name, b.score, b.total_seconds
  from best b;
$$;

-- Every run (finished or not) with its totals so far
create function public.ctf_admin_players()
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
         coalesce(sum(rc.seconds), 0)::int,
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

-- One run with its history, challenge by challenge
create function public.ctf_admin_player(p_run uuid)
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

create function public.ctf_admin_update_player(p_run uuid, p_name text, p_class text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := left(btrim(regexp_replace(coalesce(p_class, ''), '\s+', ' ', 'g')), 20);
begin
  perform public.ctf_require_admin();
  if v_name = '' or v_class = '' then raise exception 'name and class are required'; end if;
  update public.ctf_runs set name = v_name, class_name = v_class where id = p_run;
  if not found then raise exception 'run not found'; end if;
end;
$$;

create function public.ctf_admin_set_hidden(p_run uuid, p_hidden boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.ctf_require_admin();
  update public.ctf_runs set hidden = coalesce(p_hidden, false) where id = p_run;
  if not found then raise exception 'run not found'; end if;
end;
$$;

create function public.ctf_admin_delete_player(p_run uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.ctf_require_admin();
  delete from public.ctf_runs where id = p_run;
  if not found then raise exception 'run not found'; end if;
end;
$$;

-- Server-side configuration of each challenge, including the answer
create function public.ctf_admin_challenges()
returns table (id text, max_points int, fast_seconds int, slow_seconds int, answer text)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.ctf_require_admin();
  return query
  select c.id, c.max_points, c.fast_seconds, c.slow_seconds, c.answer
  from public.ctf_challenges c
  order by c.ord;
end;
$$;

-- Admin functions are for signed-in users only (and then only for listed admins)
revoke execute on function
  public.ctf_is_admin(),
  public.ctf_require_admin(),
  public.ctf_admin_players(),
  public.ctf_admin_player(uuid),
  public.ctf_admin_update_player(uuid, text, text),
  public.ctf_admin_set_hidden(uuid, boolean),
  public.ctf_admin_delete_player(uuid),
  public.ctf_admin_challenges()
from public, anon, authenticated;

grant execute on function
  public.ctf_is_admin(),
  public.ctf_admin_players(),
  public.ctf_admin_player(uuid),
  public.ctf_admin_update_player(uuid, text, text),
  public.ctf_admin_set_hidden(uuid, boolean),
  public.ctf_admin_delete_player(uuid),
  public.ctf_admin_challenges()
to authenticated;
