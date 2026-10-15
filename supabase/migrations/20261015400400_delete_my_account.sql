-- Self-service account deletion. Requires a sign-in from the last five minutes, refuses while
-- the caller owns a space other people share, deletes spaces owned alone, then the auth user.
-- Profiles and memberships cascade; authored rows stay with created_by set to null.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  issued bigint := nullif((select auth.jwt()) ->> 'iat', '')::bigint;
  membership record;
begin
  if caller is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if issued is null or issued < extract(epoch from now())::bigint - 300 then
    raise exception 'please confirm your password again' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.space_members own
    where own.user_id = caller and own.role = 'owner' and exists (
      select 1 from public.space_members other
      where other.space_id = own.space_id and other.user_id <> caller)
  ) then
    raise exception 'transfer ownership or delete your shared spaces first' using errcode = 'P0001';
  end if;
  delete from public.spaces s using public.space_members m
  where m.space_id = s.id and m.user_id = caller and m.role = 'owner';
  for membership in select space_id from public.space_members where user_id = caller loop
    perform public.after_member_left(membership.space_id, caller);
  end loop;
  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
