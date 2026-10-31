-- v0.6.1: a space can have more than one owner (Nkosi, 2026-10-31). "Make owner" now adds an owner
-- instead of handing ownership over; an owner can stop being one, or remove another owner, while at
-- least one owner remains. Leaving and deleting an account wait only on being the last owner.
drop index if exists public.space_members_one_owner;

create or replace function public.owner_count(target_space uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select count(*)::integer from public.space_members where space_id = target_space and role = 'owner'
$$;
revoke all on function public.owner_count(uuid) from public, anon, authenticated;

create or replace function public.make_owner(target_space uuid, member uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only an owner can add owners' using errcode = '42501';
  end if;
  update public.space_members set role = 'owner'
    where space_id = target_space and user_id = member and role = 'member';
  if not found then raise exception 'not a member who could become an owner' using errcode = 'P0002'; end if;
  perform public.notify(member, target_space, 'ownership_received', 'space', target_space,
    'owner:' || target_space || ':' || member || ':' || now());
end $$;

create or replace function public.remove_owner(target_space uuid, member uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only an owner can change owners' using errcode = '42501';
  end if;
  if public.owner_count(target_space) < 2 then
    raise exception 'a space keeps at least one owner' using errcode = 'P0001';
  end if;
  update public.space_members set role = 'member'
    where space_id = target_space and user_id = member and role = 'owner';
  if not found then raise exception 'not an owner' using errcode = 'P0002'; end if;
end $$;

create or replace function public.leave_space(target_space uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_space_owner(target_space) and public.owner_count(target_space) < 2 then
    raise exception 'make someone else an owner or delete the space' using errcode = 'P0001';
  end if;
  delete from public.space_members where space_id = target_space and user_id = (select auth.uid());
  if not found then raise exception 'not a member' using errcode = '42501'; end if;
  perform public.after_member_left(target_space, (select auth.uid()));
end $$;

-- Refuses only while the caller is the last owner of a space others share; spaces the caller is
-- alone in go with the account, and co-owned spaces simply lose this member.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
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
    where own.user_id = caller and own.role = 'owner'
      and public.owner_count(own.space_id) = 1
      and exists (select 1 from public.space_members other
        where other.space_id = own.space_id and other.user_id <> caller)
  ) then
    raise exception 'make someone else an owner or delete your shared spaces first'
      using errcode = 'P0001';
  end if;
  delete from public.spaces s using public.space_members m
  where m.space_id = s.id and m.user_id = caller
    and not exists (select 1 from public.space_members other
      where other.space_id = s.id and other.user_id <> caller);
  for membership in select space_id from public.space_members where user_id = caller loop
    perform public.after_member_left(membership.space_id, caller);
  end loop;
  delete from auth.users where id = caller;
end $$;

revoke all on function public.make_owner(uuid, uuid) from public, anon;
revoke all on function public.remove_owner(uuid, uuid) from public, anon;
grant execute on function public.make_owner(uuid, uuid) to authenticated;
grant execute on function public.remove_owner(uuid, uuid) to authenticated;
revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
