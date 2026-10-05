-- Player names are always stored (and therefore shown) in capital letters,
-- keeping their accents: "João da Silva" becomes "JOÃO DA SILVA".
-- Identification is unchanged: ctf_name_key still ignores case, accents and
-- extra spaces, so "joao da silva" and "JOÃO  DA SILVA" are the same player.

-- Internal: the name as stored
create function public.ctf_display_name(p_name text)
returns text language sql immutable set search_path = '' as $$
  select left(upper(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'))), 40);
$$;

update public.ctf_runs set name = public.ctf_display_name(name) where name <> public.ctf_display_name(name);

alter table public.ctf_runs
  add constraint ctf_runs_name_uppercase check (name = public.ctf_display_name(name));

create or replace function public.ctf_start(p_name text, p_class text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_name text := public.ctf_display_name(p_name);
  v_class text := upper(btrim(coalesce(p_class, '')));
  v_id uuid;
begin
  if public.ctf_name_key(v_name) = '' then raise exception 'name is required'; end if;
  if not public.ctf_valid_class(v_class) then raise exception 'invalid class'; end if;

  insert into public.ctf_runs (name, class_name) values (v_name, v_class)
  on conflict (name_key, class_key) do nothing;

  select id into v_id
  from public.ctf_runs
  where name_key = public.ctf_name_key(v_name) and class_key = v_class;

  return public.ctf_snapshot(v_id);
end;
$$;

create or replace function public.ctf_admin_update_player(p_run uuid, p_name text, p_class text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text := public.ctf_display_name(p_name);
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

revoke execute on function public.ctf_display_name(text) from public, anon, authenticated;
