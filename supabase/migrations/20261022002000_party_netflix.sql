-- Netflix parties (#66): every member plays the title on netflix.com from their own account,
-- and the Common Ground extension drives their own player (docs/runbooks/netflix-party.md).
-- The server needs nothing more than the source; start_party now accepts any party_source.
alter type public.party_source add value if not exists 'netflix';

create or replace function public.start_party(
  item uuid, src text, s1 integer, e1 integer, s2 integer, e2 integer,
  counts integer[] default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  title public.watch_items;
  created uuid;
begin
  if caller is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into title from public.watch_items w where w.id = item;
  if title.id is null or not public.is_space_member(title.space_id) then
    raise exception 'That title is no longer on your list' using errcode = 'P0002';
  end if;
  if src is null or src not in (select unnest(enum_range(null::public.party_source))::text) then
    raise exception 'Choose where you will watch' using errcode = '22023';
  end if;
  perform public.check_party_range(title.media_type, s1, e1, s2, e2, counts);
  insert into public.watch_parties (space_id, watch_item_id, host_id, source, from_season,
    from_episode, to_season, to_episode, season_episode_counts)
  values (title.space_id, item, caller, src::public.party_source, s1, e1, s2, e2,
    case when s2 > s1 then counts end)
  returning id into created;
  insert into public.watch_party_members (party_id, space_id, user_id)
    values (created, title.space_id, caller);
  perform public.notify(m.user_id, title.space_id, 'watch_party', 'watch_party', created,
    'watch_party:' || created)
  from public.space_members m where m.space_id = title.space_id;
  return created;
exception when unique_violation then
  raise exception 'A watch party for this title is already open' using errcode = '23505';
end;
$$;

-- create or replace keeps the grants 001200 and 001900 made; restated so this file stands alone.
revoke execute on function public.start_party(uuid, text, integer, integer, integer, integer,
  integer[]) from public, anon;
grant execute on function public.start_party(uuid, text, integer, integer, integer, integer,
  integer[]) to authenticated;
