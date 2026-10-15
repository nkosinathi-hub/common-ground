-- One assignee per task: must be a current member, is notified once, and is cleared on leaving.
create or replace function public.tasks_check_assignee()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.assignee_id is not null and not public.is_member_of(new.space_id, new.assignee_id) then
    raise exception 'assignee must be a member of this space' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger tasks_check_assignee before insert or update of assignee_id on public.tasks
  for each row execute function public.tasks_check_assignee();

create or replace function public.tasks_notify_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null
    and (tg_op = 'INSERT' or old.assignee_id is distinct from new.assignee_id) then
    perform public.notify(new.assignee_id, new.space_id, 'task_assigned', 'task', new.id,
      'task_assigned:' || new.id || ':' || new.assignee_id);
  end if;
  return null;
end;
$$;

create trigger tasks_notify_assignee after insert or update of assignee_id on public.tasks
  for each row execute function public.tasks_notify_assignee();

create or replace function public.tasks_clear_departed_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.tasks set assignee_id = null
    where space_id = old.space_id and assignee_id = old.user_id;
  return null;
end;
$$;

create trigger space_members_clear_task_assignee after delete on public.space_members
  for each row execute function public.tasks_clear_departed_assignee();

revoke execute on function public.tasks_check_assignee() from public, authenticated;
revoke execute on function public.tasks_notify_assignee() from public, authenticated;
revoke execute on function public.tasks_clear_departed_assignee() from public, authenticated;
