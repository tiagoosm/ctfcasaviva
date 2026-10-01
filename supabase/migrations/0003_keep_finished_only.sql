-- Only finished runs are kept.
--
-- A run has to exist on the server while it is being played (that is how time
-- and errors are measured), but it is removed when the player leaves or
-- restarts, and runs abandoned without leaving are purged after 24 hours.

-- Called when the player leaves or restarts: drops the run unless it was finished
create function public.ctf_abandon(p_run uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.ctf_runs where id = p_run and finished_at is null;
$$;

create or replace function public.ctf_start(p_name text, p_class text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := left(btrim(regexp_replace(coalesce(p_class, ''), '\s+', ' ', 'g')), 20);
  v_id uuid;
begin
  if v_name = '' or v_class = '' then raise exception 'name and class are required'; end if;

  -- Opportunistic cleanup of runs that were abandoned without leaving
  delete from public.ctf_runs
  where finished_at is null and started_at < now() - interval '24 hours';

  insert into public.ctf_runs (name, class_name) values (v_name, v_class) returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.ctf_abandon(uuid) from public;
grant execute on function public.ctf_abandon(uuid) to anon, authenticated;
