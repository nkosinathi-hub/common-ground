-- task_assigned links to the task's idea (the client opens its Tasks tab). The key still names
-- the task, so earlier notifications keep deduplicating the same way.
create or replace function public.tasks_notify_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_id is not null
    and (tg_op = 'INSERT' or old.assignee_id is distinct from new.assignee_id) then
    perform public.notify(new.assignee_id, new.space_id, 'task_assigned', 'idea', new.idea_id,
      'task_assigned:' || new.id || ':' || new.assignee_id || ':' || extract(epoch from clock_timestamp()));
  end if;
  return null;
end;
$$;

revoke execute on function public.tasks_notify_assignee() from public, anon, authenticated;
