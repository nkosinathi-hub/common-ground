-- Filtered keyset page of the shared list. Security invoker, so RLS decides what is visible.
-- sort_by 'recent': (created_at, id) descending, cursor key is created_at.
-- sort_by 'title': (sort_key, id) ascending, cursor key is sort_key.
create or replace function public.list_watch_items(
  target_space uuid,
  media public.watch_media_type default null,
  intent public.watch_intent default null,
  my_status text default null,
  search text default null,
  sort_by text default 'recent',
  after_key text default null,
  after_id uuid default null,
  page_size integer default 50
) returns table (
  id uuid, space_id uuid, catalog_type public.watch_catalog_type, catalog_id integer, title text,
  media_type public.watch_media_type, release_year integer, synopsis text, poster_path text,
  shared_intent public.watch_intent, manual_availability_note text, created_by uuid,
  created_at timestamptz, updated_at timestamptz, my_progress text, sort_key text
)
language sql
stable
set search_path = ''
as $$
  select w.id, w.space_id, w.catalog_type, w.catalog_id, w.title, w.media_type, w.release_year,
    w.synopsis, w.poster_path, w.shared_intent, w.manual_availability_note, w.created_by,
    w.created_at, w.updated_at, coalesce(p.status::text, 'not_started'),
    case when sort_by = 'title' then w.sort_key else w.created_at::text end
  from public.watch_items w
  left join public.watch_progress p on p.watch_item_id = w.id and p.user_id = (select auth.uid())
  where w.space_id = target_space
    and (media is null or w.media_type = media)
    and (intent is null or w.shared_intent = intent)
    and (my_status is null or coalesce(p.status::text, 'not_started') = my_status)
    and (search is null or btrim(search) = ''
      or strpos(w.sort_key, lower(btrim(left(search, 100)))) > 0)
    and (after_id is null or case when sort_by = 'title'
      then (w.sort_key, w.id) > (after_key, after_id)
      else (w.created_at, w.id) < (after_key::timestamptz, after_id) end)
  order by
    case when sort_by = 'title' then w.sort_key end asc,
    case when sort_by = 'title' then w.id end asc,
    case when sort_by <> 'title' then w.created_at end desc,
    case when sort_by <> 'title' then w.id end desc
  limit least(greatest(page_size, 1), 100);
$$;

grant execute on function public.list_watch_items(uuid, public.watch_media_type, public.watch_intent,
  text, text, text, text, uuid, integer) to authenticated;
