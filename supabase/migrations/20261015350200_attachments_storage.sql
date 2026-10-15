-- Private bucket for idea attachments. Object path: <space_id>/<idea_id>/<attachment_id>.
-- Clients only read (through short-lived signed URLs); uploads use signed upload URLs that the
-- Edge Function issues with the service role, and removal happens through the Storage API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- True when the object has a finalized row in a space the caller belongs to.
create or replace function public.can_read_attachment_object(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.attachments a
    where a.object_path = path
      and a.status = 'ready'
      and split_part(path, '/', 1) = a.space_id::text
      and public.is_space_member(a.space_id)
  );
$$;

revoke all on function public.can_read_attachment_object(text) from public, anon;
grant execute on function public.can_read_attachment_object(text) to authenticated;

create policy attachments_member_read on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.can_read_attachment_object(name));

-- Restrictive guards so no later permissive policy can open client writes on this bucket.
create policy attachments_no_client_insert on storage.objects as restrictive
  for insert to anon, authenticated with check (bucket_id <> 'attachments');
create policy attachments_no_client_update on storage.objects as restrictive
  for update to anon, authenticated using (bucket_id <> 'attachments');
create policy attachments_no_client_delete on storage.objects as restrictive
  for delete to anon, authenticated using (bucket_id <> 'attachments');
