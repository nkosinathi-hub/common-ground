-- Shared watchlist. A catalog title appears once per space; manual titles once per name and type.
create type public.watch_catalog_type as enum ('movie', 'tv');
create type public.watch_media_type as enum ('movie', 'series', 'anime');
create type public.watch_intent as enum ('want_to_watch', 'watch_together', 'archived');

create table public.watch_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  catalog_type public.watch_catalog_type,
  catalog_id integer check (catalog_id > 0),
  title text not null check (char_length(title) between 1 and 200),
  media_type public.watch_media_type not null,
  release_year integer check (release_year between 1870 and 2100),
  synopsis text not null default '' check (char_length(synopsis) <= 2000),
  poster_path text check (poster_path ~ '^/[A-Za-z0-9_.-]{1,100}$'),
  shared_intent public.watch_intent not null default 'want_to_watch',
  manual_availability_note text check (char_length(manual_availability_note) <= 500),
  sort_key text generated always as (lower(title)) stored,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((catalog_type is null) = (catalog_id is null)),
  check (catalog_id is not null or poster_path is null),
  unique (space_id, id),
  unique (space_id, catalog_type, catalog_id)
);

create unique index watch_items_manual_unique on public.watch_items (space_id, lower(title), media_type)
  where catalog_id is null;
create index watch_items_recent on public.watch_items (space_id, created_at desc, id desc);
create index watch_items_by_title on public.watch_items (space_id, sort_key, id);

create or replace function public.watch_items_normalise()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.title := btrim(new.title);
  new.synopsis := btrim(coalesce(new.synopsis, ''));
  new.manual_availability_note := nullif(btrim(new.manual_availability_note), '');
  return new;
end;
$$;

create trigger watch_items_normalise before insert or update on public.watch_items
  for each row execute function public.watch_items_normalise();
create trigger watch_items_updated_at before update on public.watch_items
  for each row execute function public.set_updated_at();

create or replace function public.watch_items_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.record_activity(new.space_id, 'watch_item_added', 'watch_item', new.id);
  return null;
end;
$$;
revoke execute on function public.watch_items_added() from public, authenticated;

create trigger watch_items_activity after insert on public.watch_items
  for each row execute function public.watch_items_added();
