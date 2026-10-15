-- A task's milestone belongs to the same idea; amounts stay JS-safe; clearing budget lines is moderated.
alter table public.milestones add constraint milestones_idea_id_id_key unique (idea_id, id);
alter table public.tasks drop constraint tasks_space_id_milestone_id_fkey;
alter table public.tasks add constraint tasks_idea_id_milestone_id_fkey
  foreign key (idea_id, milestone_id) references public.milestones (idea_id, id) on delete set null (milestone_id);

alter table public.budget_entries
  add constraint budget_entries_estimated_cap check (estimated_minor <= 99999999999999),
  add constraint budget_entries_actual_cap check (actual_minor <= 99999999999999);

create or replace function public.change_idea_currency(idea uuid, new_currency text, clear_entries boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid()); target_space uuid; author uuid;
begin
  if caller is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select space_id, created_by into target_space, author from public.ideas where id = idea;
  if target_space is null or not public.is_space_member(target_space) then
    raise exception 'idea not found' using errcode = '42501';
  end if;
  if new_currency !~ '^[A-Z]{3}$' then
    raise exception 'use a three-letter ISO currency code' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.budget_entries where idea_id = idea) then
    if not clear_entries then
      raise exception 'clear the budget entries before changing currency' using errcode = 'P0001';
    end if;
    if author is distinct from caller and not public.is_space_owner(target_space) then
      raise exception 'only the idea author or the space owner can clear its budget' using errcode = '42501';
    end if;
    delete from public.budget_entries where idea_id = idea;
  end if;
  update public.ideas set currency = new_currency where id = idea;
end;
$$;

-- The assignment time in the key lets a reassigned-back member hear about it again.
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
      'task_assigned:' || new.id || ':' || new.assignee_id || ':' || extract(epoch from clock_timestamp()));
  end if;
  return null;
end;
$$;
