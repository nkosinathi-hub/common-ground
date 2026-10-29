-- v0.6 (#77): a finished watch party logs its own watched-together session, with the episode
-- range and everyone who confirmed, so the title page's log fills by itself. Redefines
-- finish_party (20261022001400) with that one insert added. Idempotent.
alter table public.watch_sessions
  add column if not exists party_id uuid references public.watch_parties (id) on delete set null,
  add column if not exists from_season integer check (from_season >= 0),
  add column if not exists from_episode integer check (from_episode >= 1),
  add column if not exists to_season integer check (to_season >= 0),
  add column if not exists to_episode integer check (to_episode >= 1);
create unique index if not exists watch_sessions_party on public.watch_sessions (party_id)
  where party_id is not null;

create or replace function public.finish_party(party uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  found public.watch_parties := public.party_for_member(party);
  session uuid;
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
  from public.watch_party_members m, public.party_episodes(found.from_season, found.from_episode,
    found.to_season, found.to_episode, found.season_episode_counts) r
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
  -- The night goes in the watched-together log by itself, with its range and who confirmed.
  insert into public.watch_sessions (space_id, watch_item_id, watched_on, created_by, party_id,
    from_season, from_episode, to_season, to_episode)
  values (found.space_id, found.watch_item_id, current_date, (select auth.uid()), found.id,
    found.from_season, found.from_episode, found.to_season, found.to_episode)
  on conflict (party_id) where party_id is not null do nothing
  returning id into session;
  if session is not null then
    insert into public.watch_session_members (session_id, space_id, user_id)
    select session, found.space_id, m.user_id from public.watch_party_members m
    where m.party_id = found.id and m.confirmed;
  end if;
  update public.watch_parties set status = 'ended', ended_at = now() where id = found.id;
  perform public.record_activity(found.space_id, 'watched_together', 'watch_item',
    found.watch_item_id);
end;
$$;
revoke execute on function public.finish_party(uuid) from public, anon;
grant execute on function public.finish_party(uuid) to authenticated;
