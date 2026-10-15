-- Moderation: any member reads, adds and edits idea content; only its author or the space owner deletes it.
alter table public.task_checklist_items
  add column created_by uuid references public.profiles (id) on delete set null default auth.uid();

do $$
declare tbl text;
begin
  foreach tbl in array array['milestones', 'tasks', 'task_checklist_items', 'budget_entries'] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_member', tbl);
    execute format('create policy %I on public.%I for select to authenticated
      using (public.is_space_member(space_id))', tbl || '_select', tbl);
    execute format('create policy %I on public.%I for insert to authenticated
      with check (public.is_space_member(space_id))', tbl || '_insert', tbl);
    execute format('create policy %I on public.%I for update to authenticated
      using (public.is_space_member(space_id)) with check (public.is_space_member(space_id))',
      tbl || '_update', tbl);
  end loop;

  foreach tbl in array array['ideas', 'idea_notes', 'research_links', 'hypotheses', 'milestones', 'tasks',
    'task_checklist_items', 'budget_entries'] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_delete', tbl);
    execute format('create policy %I on public.%I for delete to authenticated
      using (public.is_space_member(space_id)
        and (created_by = (select auth.uid()) or public.is_space_owner(space_id)))', tbl || '_delete', tbl);
  end loop;
end;
$$;
