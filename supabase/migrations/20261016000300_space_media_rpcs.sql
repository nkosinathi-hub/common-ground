-- The owner points a space at an uploaded picture or cover. Returns the previous path so the
-- client can remove that object through the Storage API (SQL cannot delete storage objects).
create or replace function public.set_space_media(target_space uuid, slot text, object_path text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare previous text;
begin
  if not public.is_space_owner(target_space) then
    raise exception 'only the owner can change the space pictures' using errcode = '42501';
  end if;
  if slot is null or slot not in ('avatar', 'cover') then
    raise exception 'slot must be avatar or cover' using errcode = 'P0001';
  end if;
  if object_path is not null and (
    public.space_media_space(object_path) is distinct from target_space
    or split_part(object_path, '/', 2) <> slot
    or not exists (select 1 from storage.objects o
      where o.bucket_id = 'space-media' and o.name = object_path)
  ) then
    raise exception 'upload the picture first' using errcode = 'P0002';
  end if;
  select case when slot = 'avatar' then s.avatar_path else s.cover_path end into previous
    from public.spaces s where s.id = target_space for update;
  if slot = 'avatar' then
    update public.spaces set avatar_path = object_path where id = target_space;
  else
    update public.spaces set cover_path = object_path where id = target_space;
  end if;
  perform public.record_activity(target_space, 'space_customised', 'space', target_space);
  return previous;
end;
$$;

-- Server-side cleanup: space-media objects older than an hour that no space points at
-- (replaced pictures, abandoned uploads, deleted spaces).
create or replace function public.space_media_cleanup_candidates()
returns table (object_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name from storage.objects o
  where o.bucket_id = 'space-media'
    and o.created_at < now() - interval '1 hour'
    and not exists (select 1 from public.spaces s
      where s.avatar_path = o.name or s.cover_path = o.name)
  order by o.created_at
  limit 500;
$$;

grant execute on function public.set_space_media(uuid, text, text) to authenticated;
revoke all on function public.space_media_cleanup_candidates() from public, anon, authenticated;
grant execute on function public.space_media_cleanup_candidates() to service_role;
