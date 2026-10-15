-- Same member-only policies on every idea child table.
do $$
declare tbl text;
begin
  foreach tbl in array array['idea_notes', 'research_links', 'hypotheses'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('create policy %I on public.%I for select to authenticated
      using (public.is_space_member(space_id))', tbl || '_select', tbl);
    execute format('create policy %I on public.%I for insert to authenticated
      with check (public.is_space_member(space_id))', tbl || '_insert', tbl);
    execute format('create policy %I on public.%I for update to authenticated
      using (public.is_space_member(space_id)) with check (public.is_space_member(space_id))',
      tbl || '_update', tbl);
    execute format('create policy %I on public.%I for delete to authenticated
      using (public.is_space_member(space_id))', tbl || '_delete', tbl);
  end loop;
end;
$$;
