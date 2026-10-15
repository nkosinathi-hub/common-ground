-- Members read only the columns the app shows. The storage object path, declared type and
-- upload state stay server-side (Edge Function and security definer RPCs use the service role).
revoke select on public.attachments from authenticated;
grant select (id, space_id, idea_id, uploader_id, filename, verified_mime, bytes, created_at)
  on public.attachments to authenticated;
