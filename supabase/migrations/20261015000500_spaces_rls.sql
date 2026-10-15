-- Read access for members; all writes to spaces/membership go through RPCs except rename.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_space_with(id));

create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy spaces_select on public.spaces for select to authenticated
  using (public.is_space_member(id));

create policy spaces_update_owner on public.spaces for update to authenticated
  using (public.is_space_owner(id)) with check (public.is_space_owner(id));

create policy space_members_select on public.space_members for select to authenticated
  using (public.is_space_member(space_id));

grant select, update (display_name) on public.profiles to authenticated;
grant select, update (name, template) on public.spaces to authenticated;
grant select on public.space_members to authenticated;
