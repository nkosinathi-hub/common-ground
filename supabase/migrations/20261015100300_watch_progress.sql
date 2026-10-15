-- Per-member progress on a shared title. Members read everyone's; each writes only their own.
create type public.watch_status as enum ('not_started', 'watching', 'completed', 'dropped');

create table public.watch_progress (
  watch_item_id uuid not null,
  space_id uuid not null,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  status public.watch_status not null default 'not_started',
  season integer check (season >= 0),
  episode integer check (episode >= 0),
  rating smallint check (rating between 1 and 5),
  completed_on date,
  updated_at timestamptz not null default now(),
  primary key (watch_item_id, user_id),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete cascade
);
create index watch_progress_user on public.watch_progress (user_id);

create trigger watch_progress_updated_at before update on public.watch_progress
  for each row execute function public.set_updated_at();

alter table public.watch_progress enable row level security;

create policy watch_progress_select on public.watch_progress for select to authenticated
  using (public.is_space_member(space_id));
create policy watch_progress_insert_own on public.watch_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_space_member(space_id));
create policy watch_progress_update_own on public.watch_progress for update to authenticated
  using (user_id = (select auth.uid()) and public.is_space_member(space_id))
  with check (user_id = (select auth.uid()) and public.is_space_member(space_id));

grant select on public.watch_progress to authenticated;
grant insert (watch_item_id, space_id, status, season, episode, rating, completed_on)
  on public.watch_progress to authenticated;
grant update (status, season, episode, rating, completed_on) on public.watch_progress
  to authenticated;

-- Upserts the caller's own row. Security invoker: RLS and column grants still apply.
create or replace function public.save_watch_progress(
  item uuid, new_status public.watch_status, new_season integer, new_episode integer,
  new_rating integer, new_completed_on date
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
    (watch_item_id, space_id, status, season, episode, rating, completed_on)
  values (item, target_space, new_status, new_season, new_episode, new_rating, new_completed_on)
  on conflict (watch_item_id, user_id) do update set
    status = excluded.status, season = excluded.season, episode = excluded.episode,
    rating = excluded.rating, completed_on = excluded.completed_on;
end;
$$;

grant execute on function public.save_watch_progress(uuid, public.watch_status, integer, integer,
  integer, date) to authenticated;
