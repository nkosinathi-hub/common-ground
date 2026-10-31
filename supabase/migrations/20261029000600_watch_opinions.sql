-- v0.6 (#77): like / dislike replaces the star rating. Private to its author: no other member
-- reads it, and it always sits in its title's space (the composite key enforces that).
do $$ begin
  create type public.watch_opinion as enum ('liked', 'disliked');
exception when duplicate_object then null; end $$;

create table if not exists public.watch_opinions (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  space_id uuid not null,
  watch_item_id uuid not null,
  opinion public.watch_opinion not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, watch_item_id),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete cascade
);
-- The For you lookup reads one person's opinions in one space; the second serves the key.
create index if not exists watch_opinions_user_space
  on public.watch_opinions (user_id, space_id);
create index if not exists watch_opinions_item
  on public.watch_opinions (space_id, watch_item_id);

alter table public.watch_opinions enable row level security;
drop policy if exists watch_opinions_own on public.watch_opinions;
create policy watch_opinions_own on public.watch_opinions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_space_member(space_id));

drop trigger if exists watch_opinions_touch on public.watch_opinions;
create trigger watch_opinions_touch before update on public.watch_opinions
  for each row execute function public.set_updated_at();

revoke all on public.watch_opinions from anon, authenticated;
grant select, delete on public.watch_opinions to authenticated;
grant insert (space_id, watch_item_id, opinion) on public.watch_opinions to authenticated;
grant update (opinion) on public.watch_opinions to authenticated;

-- The stars go, with no mapping (Nkosi, 2026-10-29): the old save function first, then the column.
drop function if exists public.save_watch_progress(uuid, public.watch_status, integer, integer,
  integer, date);
create or replace function public.save_watch_progress(
  item uuid, new_status public.watch_status, new_season integer, new_episode integer,
  new_completed_on date
) returns void
language plpgsql
set search_path = ''
as $$
declare target_space uuid;
begin
  select w.space_id into target_space from public.watch_items w where w.id = item;
  if target_space is null then
    raise exception 'That title is no longer on your list' using errcode = 'P0002';
  end if;
  insert into public.watch_progress
    (watch_item_id, space_id, status, season, episode, completed_on)
  values (item, target_space, new_status, new_season, new_episode, new_completed_on)
  on conflict (watch_item_id, user_id) do update set
    status = excluded.status, season = excluded.season, episode = excluded.episode,
    completed_on = excluded.completed_on;
end;
$$;
revoke execute on function public.save_watch_progress(uuid, public.watch_status, integer, integer,
  date) from public, anon;
grant execute on function public.save_watch_progress(uuid, public.watch_status, integer, integer,
  date) to authenticated;

alter table public.watch_progress drop column if exists rating;
