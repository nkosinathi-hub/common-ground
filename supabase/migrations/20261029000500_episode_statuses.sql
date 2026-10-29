-- v0.6 (#77): each watched episode of a title for the Episodes tab (M03b): who has seen it and
-- when the space saw it together (a watch party). Security invoker, so episode_watches' RLS
-- (members of the space) decides what a caller sees; an unwatched episode has no row.
create or replace function public.episode_statuses(target_item uuid)
returns table (season integer, episode integer, together_on date, watched_by uuid[])
language sql
stable
security invoker
set search_path = ''
as $$
  select e.season, e.episode,
    (min(e.watched_at) filter (where e.source = 'party'))::date,
    array_agg(distinct e.user_id order by e.user_id)
  from public.episode_watches e
  where e.watch_item_id = target_item and e.season is not null
  group by e.season, e.episode
  order by e.season, e.episode;
$$;

revoke execute on function public.episode_statuses(uuid) from public, anon;
grant execute on function public.episode_statuses(uuid) to authenticated;
