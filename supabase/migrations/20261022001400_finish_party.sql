-- Finishing a live party credits each confirmed member with every episode of its range
-- (episode_watches, source 'party'; a film is one row without an episode). Together progress
-- moves only when every current member of the space confirmed, and only forwards: a rewatch
-- behind it is personal history only. Personal pointers follow episode_watches elsewhere.

-- Internal: the episodes of a range, across season boundaries; one null row for a film.
create or replace function public.party_episodes(party public.watch_parties)
returns table (season integer, episode integer)
language sql
immutable
set search_path = ''
as $$
  select null::integer, null::integer where party.from_season is null
  union all
  select s, e from generate_series(party.from_season, party.to_season) s,
    generate_series(case when s = party.from_season then party.from_episode else 1 end,
      case when s = party.to_season then party.to_episode
        else party.season_episode_counts[s - party.from_season + 1] end) e
  where party.from_season is not null;
$$;

create or replace function public.finish_party(party uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare found public.watch_parties := public.party_for_member(party);
begin
  if found.status <> 'live' then
    raise exception 'Only a party that is on can be finished' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.watch_party_members m where m.party_id = found.id
    and m.user_id = (select auth.uid()) and m.confirmed) then
    raise exception 'Only someone who watched can finish the party' using errcode = '42501';
  end if;
  insert into public.episode_watches (space_id, watch_item_id, user_id, season, episode, source,
    party_id)
  select found.space_id, found.watch_item_id, m.user_id, r.season, r.episode, 'party', found.id
  from public.watch_party_members m, public.party_episodes(found) r
  where m.party_id = found.id and m.confirmed;

  if not exists (select 1 from public.space_members s where s.space_id = found.space_id
    and not exists (select 1 from public.watch_party_members m where m.party_id = found.id
      and m.user_id = s.user_id and m.confirmed)) then
    insert into public.together_progress (space_id, watch_item_id, season, episode)
      values (found.space_id, found.watch_item_id, found.to_season, found.to_episode)
    on conflict (watch_item_id) do update
      set season = excluded.season, episode = excluded.episode, updated_at = now()
      where (public.together_progress.season, public.together_progress.episode)
        < (excluded.season, excluded.episode);
  end if;
  update public.watch_parties set status = 'ended', ended_at = now() where id = found.id;
  perform public.record_activity(found.space_id, 'watched_together', 'watch_item',
    found.watch_item_id);
end;
$$;

revoke execute on function public.party_episodes(public.watch_parties)
  from public, anon, authenticated;
grant execute on function public.finish_party(uuid) to authenticated;
