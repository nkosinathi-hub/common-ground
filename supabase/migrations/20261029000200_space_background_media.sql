-- v0.6 (#75): the background picture is a third space-media slot beside avatar and cover.
-- Redefines space_media_space and space_media_cleanup_candidates
-- (20261016000200, 20261016000300) and set_space_media (20261016000300).
alter table public.spaces
  add column if not exists background_path text
    constraint spaces_background_path_check check (background_path ~ ('^' || id::text
      || '/background/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      || '\.(jpg|png|webp)$'));

create or replace function public.space_media_space(path text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case when path ~ ('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
      || '/(avatar|cover|background)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}'
      || '-[0-9a-f]{12}\.(jpg|png|webp)$')
    then split_part(path, '/', 1)::uuid end;
$$;

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
  if slot is null or slot not in ('avatar', 'cover', 'background') then
    raise exception 'slot must be avatar, cover or background' using errcode = 'P0001';
  end if;
  if object_path is not null and (
    public.space_media_space(object_path) is distinct from target_space
    or split_part(object_path, '/', 2) <> slot
    or not exists (select 1 from storage.objects o
      where o.bucket_id = 'space-media' and o.name = object_path)
  ) then
    raise exception 'upload the picture first' using errcode = 'P0002';
  end if;
  select case slot when 'avatar' then s.avatar_path when 'cover' then s.cover_path
      else s.background_path end into previous
    from public.spaces s where s.id = target_space for update;
  update public.spaces set
    avatar_path = case when slot = 'avatar' then object_path else avatar_path end,
    cover_path = case when slot = 'cover' then object_path else cover_path end,
    background_path = case when slot = 'background' then object_path else background_path end
  where id = target_space;
  perform public.record_activity(target_space, 'space_customised', 'space', target_space);
  return previous;
end;
$$;

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
      where o.name in (s.avatar_path, s.cover_path, s.background_path))
  order by o.created_at
  limit 500;
$$;

grant execute on function public.set_space_media(uuid, text, text) to authenticated;
revoke all on function public.space_media_cleanup_candidates() from public, anon, authenticated;
grant execute on function public.space_media_cleanup_candidates() to service_role;
