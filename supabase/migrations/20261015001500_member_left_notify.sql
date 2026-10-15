-- Owners hear when a member leaves or is removed. Registered as its own AFTER DELETE trigger, as
-- 20261015000800_member_left_hook.sql asks.
-- It writes the row itself rather than through public.notify: notify asks is_member_of, which only
-- answers for a caller who is still in the space, and the member who just left is the caller.
-- The same rules apply here: the actor (an owner removing someone) is skipped, the departing user
-- is never a recipient, and a repeat of the same key is ignored. Nothing is sent when the whole
-- space is being deleted: by the time the cascade reaches space_members, the spaces row is gone.
-- An actor whose profile is already gone (deleting their own account) is recorded as null.
create or replace function public.notify_owners_member_left()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare actor uuid;
begin
  select id into actor from public.profiles where id = (select auth.uid());
  if not exists (select 1 from public.spaces where id = old.space_id) then return old; end if;
  insert into public.notifications
    (recipient_id, space_id, type, subject_type, subject_id, actor_id, deduplication_key)
  select m.user_id, old.space_id, 'member_left', 'profile', old.user_id, actor,
    'member_left:' || old.space_id || ':' || old.user_id || ':'
      || floor(extract(epoch from now()))::bigint
  from public.space_members m
  where m.space_id = old.space_id and m.role = 'owner' and m.user_id <> old.user_id
    and m.user_id is distinct from actor
  on conflict (recipient_id, deduplication_key) do nothing;
  return old;
end;
$$;
revoke execute on function public.notify_owners_member_left() from public, authenticated;

create trigger space_members_notify_owners_member_left
  after delete on public.space_members
  for each row execute function public.notify_owners_member_left();
