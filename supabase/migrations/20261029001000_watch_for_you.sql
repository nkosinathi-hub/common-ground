-- v0.6 (#77): personal For you. Each catalog title carries its canonical genres and whether it
-- streams in South Africa; only the catalog Edge Function writes them (service role). The score
-- reads the caller's own likes and dislikes in the space, so it is personal and private.
alter table public.watch_items
  add column if not exists genres text[] not null default '{}',
  add column if not exists streamable boolean not null default false;

-- Idempotent: the same features again change nothing, so concurrent page visits are harmless.
create or replace function public.set_watch_features(
  target_space uuid, kind public.watch_catalog_type, tmdb_id integer, new_genres text[],
  new_streamable boolean
) returns void
language sql
security definer
set search_path = ''
as $$
  update public.watch_items w set genres = coalesce(new_genres, '{}'), streamable = new_streamable
  where w.space_id = target_space and w.catalog_type = kind and w.catalog_id = tmdb_id
    and (w.genres is distinct from coalesce(new_genres, '{}') or w.streamable <> new_streamable);
$$;
revoke execute on function public.set_watch_features(uuid, public.watch_catalog_type, integer,
  text[], boolean) from public, anon, authenticated;
grant execute on function public.set_watch_features(uuid, public.watch_catalog_type, integer,
  text[], boolean) to service_role;

-- Genre weight = (likes - dislikes) / (opinions + 2): one like nudges, it does not decide.
-- Score = mean weight over the title's genres, plus 0.1 when it streams here. Providers are not
-- learned: liking a show says nothing about its service. Security invoker: RLS keeps it yours.
create or replace function public.watch_for_you(target_space uuid)
returns table (item_id uuid, score numeric, reason text, opinion public.watch_opinion)
language sql
stable
set search_path = ''
as $$
  with mine as (
    select o.opinion, w.genres from public.watch_opinions o
    join public.watch_items w on w.id = o.watch_item_id
    where o.user_id = (select auth.uid()) and o.space_id = target_space
  ), weights as (
    select g, (count(*) filter (where m.opinion = 'liked')
      - count(*) filter (where m.opinion = 'disliked'))::numeric / (count(*) + 2) as w
    from mine m, unnest(m.genres) g group by g
  )
  select w.id,
    round(coalesce((select avg(coalesce(k.w, 0)) from unnest(w.genres) gg
      left join weights k on k.g = gg), 0) + case when w.streamable then 0.1 else 0 end, 4),
    (select gg from unnest(w.genres) gg join weights k on k.g = gg where k.w > 0
      order by k.w desc, gg limit 1),
    o.opinion
  from public.watch_items w
  left join public.watch_opinions o on o.watch_item_id = w.id and o.user_id = (select auth.uid())
  where w.space_id = target_space;
$$;
revoke execute on function public.watch_for_you(uuid) from public, anon;
grant execute on function public.watch_for_you(uuid) to authenticated;
