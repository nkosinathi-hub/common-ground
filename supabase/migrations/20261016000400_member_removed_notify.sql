-- The removed member is told. The row is written directly, not through public.notify: they are
-- no longer a member, so notify's membership check would drop it. The feed records
-- 'member_removed' (actor: the owner, subject: the removed profile) rather than after_member_left's
-- 'member_left', which read as if the owner had left. leave_space is unchanged.
create or replace function public.remove_member(target_space uuid, member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can remove members' using errcode = '42501';
  end if;
  if member = (select auth.uid()) then
    raise exception 'owner cannot remove themselves' using errcode = 'P0001';
  end if;
  delete from public.space_members where space_id = target_space and user_id = member;
  if not found then raise exception 'not a member' using errcode = 'P0002'; end if;
  perform public.record_activity(target_space, 'member_removed', 'profile', member);
  insert into public.notifications
    (recipient_id, space_id, type, subject_type, subject_id, actor_id, deduplication_key)
  values (member, target_space, 'member_removed', 'space', target_space, (select auth.uid()),
    'member_removed:' || target_space || ':' || member || ':'
      || floor(extract(epoch from now()))::bigint)
  on conflict (recipient_id, deduplication_key) do nothing;
end;
$$;

grant execute on function public.remove_member(uuid, uuid) to authenticated;
