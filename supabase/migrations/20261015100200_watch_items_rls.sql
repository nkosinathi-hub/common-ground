-- Members read and edit the shared list; only the author or the space owner deletes.
-- Catalog columns, author and timestamps are server-owned: catalog adds go through the RPC.
alter table public.watch_items enable row level security;

create policy watch_items_select on public.watch_items for select to authenticated
  using (public.is_space_member(space_id));

create policy watch_items_insert on public.watch_items for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = (select auth.uid()));

create policy watch_items_update on public.watch_items for update to authenticated
  using (public.is_space_member(space_id)) with check (public.is_space_member(space_id));

create policy watch_items_delete on public.watch_items for delete to authenticated
  using (
    public.is_space_member(space_id)
    and (created_by = (select auth.uid()) or public.is_space_owner(space_id))
  );

grant select, delete on public.watch_items to authenticated;
grant insert (space_id, title, media_type, release_year, synopsis, shared_intent,
  manual_availability_note) on public.watch_items to authenticated;
grant update (title, media_type, release_year, synopsis, shared_intent, manual_availability_note)
  on public.watch_items to authenticated;

create or replace function public.add_catalog_title(
  target_space uuid, kind public.watch_catalog_type, tmdb_id integer, title text,
  media public.watch_media_type, release_year integer, synopsis text, poster_path text,
  intent public.watch_intent
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  if not public.is_space_member(target_space) then
    raise exception 'not a member of this space' using errcode = '42501';
  end if;
  insert into public.watch_items (space_id, catalog_type, catalog_id, title, media_type,
    release_year, synopsis, poster_path, shared_intent, created_by)
  values (target_space, kind, tmdb_id, title, media, release_year, synopsis, poster_path, intent,
    (select auth.uid()))
  returning id into new_id;
  return new_id;
exception when unique_violation then
  raise exception 'Already on your list' using errcode = 'P0001';
end;
$$;

grant execute on function public.add_catalog_title(uuid, public.watch_catalog_type, integer, text,
  public.watch_media_type, integer, text, text, public.watch_intent) to authenticated;
