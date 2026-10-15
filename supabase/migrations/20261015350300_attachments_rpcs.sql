-- Delete by the uploader or the space owner. The row is marked rejected (hidden at once, so
-- its object is unreadable) and the cleanup job removes the object and the row.
create or replace function public.delete_attachment(target uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  found_row public.attachments;
begin
  if caller is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into found_row from public.attachments where id = target and status = 'ready' for update;
  if not found or not public.is_space_member(found_row.space_id) then
    raise exception 'attachment not found' using errcode = 'P0002';
  end if;
  if found_row.uploader_id is distinct from caller
     and not public.is_space_owner(found_row.space_id) then
    raise exception 'only the uploader or the owner can delete this file' using errcode = '42501';
  end if;
  update public.attachments set status = 'rejected' where id = target;
  return found_row.object_path;
end;
$$;

revoke all on function public.delete_attachment(uuid) from public, anon;
grant execute on function public.delete_attachment(uuid) to authenticated;

-- What the cleanup job removes: uploads abandoned for over an hour, rejected or deleted rows,
-- and objects left without a row (for example after their idea was deleted). Service role only.
create or replace function public.cleanup_candidates()
returns table (attachment_id uuid, object_path text)
language sql
stable
security definer
set search_path = ''
as $$
  (
    select a.id, a.object_path from public.attachments a
    where a.status = 'rejected'
       or (a.status = 'pending' and a.created_at < now() - interval '1 hour')
    order by a.created_at
    limit 500
  )
  union all
  (
    select null::uuid, o.name from storage.objects o
    where o.bucket_id = 'attachments'
      and o.created_at < now() - interval '1 hour'
      and not exists (select 1 from public.attachments a where a.object_path = o.name)
    order by o.created_at
    limit 500
  );
$$;

revoke all on function public.cleanup_candidates() from public, anon, authenticated;
grant execute on function public.cleanup_candidates() to service_role;
