-- Starting a party: the range is checked against the title (a film names no episodes, a series
-- names a forward range, with the episode count of every season it leaves), the host is in, and
-- every other member of the space hears "X started a watch party" (v0.4 pushes it).

-- Internal: the party, when the caller is signed in and a member of its space.
create or replace function public.party_for_member(party uuid)
returns public.watch_parties
language plpgsql
stable
security definer
set search_path = ''
as $$
declare found public.watch_parties;
begin
  if (select auth.uid()) is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  select * into found from public.watch_parties w where w.id = party;
  if found.id is null or not public.is_space_member(found.space_id) then
    raise exception 'That watch party is no longer available' using errcode = 'P0002';
  end if;
  return found;
end;
$$;

-- Internal: refuses a range the title cannot have.
create or replace function public.check_party_range(
  media public.watch_media_type, s1 integer, e1 integer, s2 integer, e2 integer, counts integer[]
) returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if media = 'movie' then
    if num_nonnulls(s1, e1, s2, e2) > 0 then
      raise exception 'A film has no episodes to choose' using errcode = '22023';
    end if;
    return;
  end if;
  if num_nulls(s1, e1, s2, e2) > 0 or s1 < 0 or e1 < 1 or e2 < 1 or (s2, e2) < (s1, e1) then
    raise exception 'Choose the episodes you will watch, first to last' using errcode = '22023';
  end if;
  if s2 > s1 and (coalesce(cardinality(counts), 0) <> s2 - s1
      or exists (select 1 from unnest(counts) c where c is null or c < 1) or e1 > counts[1]) then
    raise exception 'Each season the party leaves needs its episode count' using errcode = '22023';
  end if;
end;
$$;

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
  if src is null or src not in ('jellyfin', 'external') then
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

revoke execute on function public.party_for_member(uuid) from public, anon, authenticated;
revoke execute on function public.check_party_range(public.watch_media_type, integer, integer,
  integer, integer, integer[]) from public, anon, authenticated;
grant execute on function public.start_party(uuid, text, integer, integer, integer, integer,
  integer[]) to authenticated;
