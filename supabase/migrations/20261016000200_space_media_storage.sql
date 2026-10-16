-- Private bucket for space pictures and covers: <space>/(avatar|cover)/<uuid>.(jpg|png|webp).
-- Members read through signed URLs; the owner uploads (at most 6 objects) and deletes; no updates,
-- so every upload is a new name and a cached signed URL never shows a different image.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('space-media', 'space-media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The space an object path belongs to, or null for any other shape.
create or replace function public.space_media_space(path text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when path ~ ('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      || '/(avatar|cover)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      || '\.(jpg|png|webp)$')
    then split_part(path, '/', 1)::uuid end;
$$;

create or replace function public.space_media_quota_ok(target_space uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_space_owner(target_space) and (
    select count(*) from storage.objects
    where bucket_id = 'space-media' and name like target_space::text || '/%'
  ) < 6;
$$;

grant execute on function public.space_media_space(text) to authenticated;
grant execute on function public.space_media_quota_ok(uuid) to authenticated;

create policy space_media_member_read on storage.objects for select to authenticated
  using (bucket_id = 'space-media' and public.is_space_member(public.space_media_space(name)));
create policy space_media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'space-media'
    and public.is_space_owner(public.space_media_space(name))
    and public.space_media_quota_ok(public.space_media_space(name)));
create policy space_media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'space-media' and public.is_space_owner(public.space_media_space(name)));
create policy space_media_no_update on storage.objects as restrictive
  for update to anon, authenticated using (bucket_id <> 'space-media');
