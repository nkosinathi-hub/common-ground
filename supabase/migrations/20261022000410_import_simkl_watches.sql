-- Simkl history into episode_watches (20261022000100), for the simkl Edge Function only. Each
-- watch names a TMDB title; it lands on that title in every space the user belongs to, once:
-- a watch already recorded for (user, item, season, episode, watched_at) is skipped, so a
-- re-sync adds nothing. The forward-only trigger (20261022000200) moves her place. The cursor
-- advances in the same transaction, so a failed import leaves it where it was.
create or replace function public.import_simkl_watches(
  target_user uuid, watches jsonb, new_cursor timestamptz
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare added integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('simkl:' || target_user::text, 0));
  if not exists (select 1 from public.simkl_links l where l.user_id = target_user) then
    raise exception 'No Simkl link for this user' using errcode = 'P0002';
  end if;
  with incoming as (
    select distinct (w ->> 'type')::public.watch_catalog_type as kind,
      (w ->> 'tmdb')::integer as tmdb, (w ->> 'season')::integer as season,
      (w ->> 'episode')::integer as episode, (w ->> 'watched_at')::timestamptz as watched_at
    from jsonb_array_elements(watches) w
  ), matched as (
    select i.space_id, i.id as item, n.season, n.episode, n.watched_at
    from incoming n
    join public.watch_items i on i.catalog_type = n.kind and i.catalog_id = n.tmdb
    join public.space_members m on m.space_id = i.space_id and m.user_id = target_user
    where (n.kind = 'movie') = (n.season is null)
  ), inserted as (
    insert into public.episode_watches
      (space_id, watch_item_id, user_id, season, episode, watched_at, source)
    select t.space_id, t.item, target_user, t.season, t.episode, t.watched_at, 'simkl'
    from matched t
    where not exists (
      select 1 from public.episode_watches e
      where e.user_id = target_user and e.watch_item_id = t.item
        and e.season is not distinct from t.season and e.episode is not distinct from t.episode
        and e.watched_at = t.watched_at)
    order by t.watched_at
    returning 1
  )
  select count(*)::integer into added from inserted;
  update public.simkl_links set cursor = coalesce(new_cursor, cursor), last_synced_at = now()
    where user_id = target_user;
  return added;
end;
$$;

revoke execute on function public.import_simkl_watches(uuid, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.import_simkl_watches(uuid, jsonb, timestamptz) to service_role;
