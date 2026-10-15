-- Milestones and tasks for an idea, with checklist items per task.
create type public.task_status as enum ('backlog', 'todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  target_date date,
  completed_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 4000),
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'medium',
  due_date date,
  assignee_id uuid references public.profiles (id) on delete set null,
  milestone_id uuid,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade,
  foreign key (space_id, milestone_id) references public.milestones (space_id, id)
    on delete set null (milestone_id)
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  task_id uuid not null,
  label text not null check (char_length(btrim(label)) between 1 and 200),
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, task_id) references public.tasks (space_id, id) on delete cascade
);

create index milestones_idea on public.milestones (idea_id, target_date nulls last, id);
create index tasks_page on public.tasks (idea_id, created_at desc, id desc);
create index tasks_assignee on public.tasks (space_id, assignee_id) where assignee_id is not null;
create index task_checklist_items_task on public.task_checklist_items (task_id, position, id);

create trigger milestones_updated_at before update on public.milestones
  for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger task_checklist_items_updated_at before update on public.task_checklist_items
  for each row execute function public.set_updated_at();

revoke all on public.milestones, public.tasks, public.task_checklist_items from anon, authenticated;
grant select, delete on public.milestones, public.tasks, public.task_checklist_items to authenticated;
grant insert (id, space_id, idea_id, title, target_date, completed_at),
  update (title, target_date, completed_at) on public.milestones to authenticated;
grant insert (id, space_id, idea_id, title, description, status, priority, due_date, assignee_id, milestone_id),
  update (title, description, status, priority, due_date, assignee_id, milestone_id)
  on public.tasks to authenticated;
grant insert (space_id, task_id, label, done, position), update (label, done, position)
  on public.task_checklist_items to authenticated;

do $$
declare tbl text;
begin
  foreach tbl in array array['milestones', 'tasks', 'task_checklist_items'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('create policy %I on public.%I for all to authenticated
      using (public.is_space_member(space_id)) with check (public.is_space_member(space_id))',
      tbl || '_member', tbl);
  end loop;
end;
$$;
