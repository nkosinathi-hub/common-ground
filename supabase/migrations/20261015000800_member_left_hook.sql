-- Extension point: features clear active assignments etc. when a member leaves or is removed.
-- Each feature appends its own statement by redefining this function in a later migration
-- is fragile, so features instead register an AFTER DELETE trigger on space_members.
create or replace function public.after_member_left(target_space uuid, member uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_activity(target_space, 'member_left', 'profile', member);
end;
$$;
revoke execute on function public.after_member_left(uuid, uuid) from public, authenticated;

grant execute on function public.create_space(text, public.space_template) to authenticated;
grant execute on function public.leave_space(uuid) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;
grant execute on function public.delete_space(uuid, text) to authenticated;
