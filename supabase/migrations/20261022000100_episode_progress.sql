-- Episode history (episode_watches, 20261022001000) moves each person's place in a show
-- forward, never back: a rewatch or a party behind someone adds history only. Specials
-- (season 0) are history only. A film's row has no season or episode and completes it.
-- Moving back stays possible by hand through save_watch_progress.
create or replace function public.episode_watches_advance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.season is null then
    insert into public.watch_progress (watch_item_id, space_id, user_id, status, completed_on)
    values (new.watch_item_id, new.space_id, new.user_id, 'completed', new.watched_at::date)
    on conflict (watch_item_id, user_id) do update set status = 'completed',
      completed_on = coalesce(public.watch_progress.completed_on, excluded.completed_on);
  elsif new.season > 0 then
    insert into public.watch_progress (watch_item_id, space_id, user_id, status, season, episode)
    values (new.watch_item_id, new.space_id, new.user_id, 'watching', new.season, new.episode)
    on conflict (watch_item_id, user_id) do update set
      season = excluded.season, episode = excluded.episode,
      status = case when public.watch_progress.status = 'not_started' then 'watching'
        else public.watch_progress.status end
    where (coalesce(public.watch_progress.season, 0), coalesce(public.watch_progress.episode, 0))
      < (excluded.season, excluded.episode);
  end if;
  return null;
end;
$$;

revoke execute on function public.episode_watches_advance() from public, anon, authenticated;

create trigger episode_watches_advance after insert on public.episode_watches
  for each row execute function public.episode_watches_advance();

-- One episode (or a film, season and episode null) the caller watched. Parties write their own
-- history through finish_party; the player sends 'jellyfin', a tick by hand 'manual'.
create or replace function public.mark_episode_watched(
  item uuid, watched_season integer, watched_episode integer, origin text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare target_space uuid; caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'sign in required' using errcode = '28000'; end if;
  if origin not in ('manual', 'jellyfin') then
    raise exception 'Unknown history source' using errcode = '22023';
  end if;
  select w.space_id into target_space from public.watch_items w
    where w.id = item and public.is_space_member(w.space_id);
  if target_space is null then
    raise exception 'That title is no longer on your list' using errcode = 'P0002';
  end if;
  insert into public.episode_watches (space_id, watch_item_id, user_id, season, episode, source)
  values (target_space, item, caller, watched_season, watched_episode, origin);
end;
$$;

revoke execute on function public.mark_episode_watched(uuid, integer, integer, text)
  from public, anon;
grant execute on function public.mark_episode_watched(uuid, integer, integer, text)
  to authenticated;
