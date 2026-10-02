-- The class is no longer free text: it must be one of the school's classes.
-- Keep this list in sync with src/game/groups.js.

create function public.ctf_valid_class(p_class text)
returns boolean language sql immutable set search_path = '' as $$
  select p_class = any (array['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4']);
$$;

create or replace function public.ctf_start(p_name text, p_class text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := upper(btrim(coalesce(p_class, '')));
  v_id uuid;
begin
  if v_name = '' then raise exception 'name is required'; end if;
  if not public.ctf_valid_class(v_class) then raise exception 'invalid class'; end if;

  -- Opportunistic cleanup of runs that were abandoned without leaving
  delete from public.ctf_runs
  where finished_at is null and started_at < now() - interval '24 hours';

  insert into public.ctf_runs (name, class_name) values (v_name, v_class) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.ctf_admin_update_player(p_run uuid, p_name text, p_class text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40);
  v_class text := upper(btrim(coalesce(p_class, '')));
begin
  perform public.ctf_require_admin();
  if v_name = '' then raise exception 'name is required'; end if;
  if not public.ctf_valid_class(v_class) then raise exception 'invalid class'; end if;
  update public.ctf_runs set name = v_name, class_name = v_class where id = p_run;
  if not found then raise exception 'run not found'; end if;
end;
$$;

revoke execute on function public.ctf_valid_class(text) from public, anon, authenticated;
