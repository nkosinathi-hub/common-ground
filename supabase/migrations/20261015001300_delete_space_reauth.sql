-- Destructive owner actions need a sign-in from the last five minutes, checked on the server
-- (the client reauthenticates first, which mints a token with a fresh iat).
create or replace function public.require_recent_sign_in()
returns void
language plpgsql
stable
set search_path = ''
as $$
declare issued bigint := nullif((select auth.jwt()) ->> 'iat', '')::bigint;
begin
  if issued is null or issued < extract(epoch from now())::bigint - 300 then
    raise exception 'please confirm your password again' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.delete_space(target_space uuid, confirm_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can delete the space' using errcode = '42501';
  end if;
  perform public.require_recent_sign_in();
  if not exists (select 1 from public.spaces where id = target_space and name = confirm_name) then
    raise exception 'confirmation does not match the space name' using errcode = 'P0001';
  end if;
  delete from public.spaces where id = target_space;
end;
$$;

revoke all on function public.require_recent_sign_in() from public, anon, authenticated;
