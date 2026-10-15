-- Idea work feeds the space activity log through public.record_activity.
create or replace function public.ideas_record_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'ideas' then
    if tg_op = 'INSERT' then
      perform public.record_activity(new.space_id, 'idea_created', 'idea', new.id);
    elsif old.stage is distinct from new.stage then
      perform public.record_activity(new.space_id, 'idea_stage_changed', 'idea', new.id);
    end if;
  elsif tg_table_name = 'tasks' then
    if tg_op = 'INSERT' then
      perform public.record_activity(new.space_id, 'task_created', 'task', new.id);
    elsif new.status = 'done' and old.status is distinct from 'done' then
      perform public.record_activity(new.space_id, 'task_completed', 'task', new.id);
    end if;
  elsif new.completed_at is not null and old.completed_at is null then
    perform public.record_activity(new.space_id, 'milestone_completed', 'milestone', new.id);
  end if;
  return null;
end;
$$;

create trigger ideas_activity after insert or update of stage on public.ideas
  for each row execute function public.ideas_record_activity();
create trigger tasks_activity after insert or update of status on public.tasks
  for each row execute function public.ideas_record_activity();
create trigger milestones_activity after update of completed_at on public.milestones
  for each row execute function public.ideas_record_activity();

revoke execute on function public.ideas_record_activity() from public, authenticated;
