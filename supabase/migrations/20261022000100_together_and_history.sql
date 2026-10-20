-- Episode history and the together pointer, as the v0.5 plan's data model defines them.
-- 20261022000200 moves each person's place from this history. A film has no season or
-- episode: its rows leave both null. The party foreign key on episode_watches.party_id
-- is added by 20261022001100_watch_parties, which creates the parties table.
create table public.episode_watches (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  watch_item_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  season integer check (season >= 0),
  episode integer check (episode >= 0),
  watched_at timestamptz not null default now(),
  source text not null check (source in ('jellyfin', 'simkl', 'manual', 'party')),
  party_id uuid,
  check ((season is null) = (episode is null)),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete cascade
);
create index episode_watches_item on public.episode_watches (watch_item_id, user_id, watched_at desc);
create index episode_watches_user on public.episode_watches (user_id);

-- Where the space has watched a title together; written only by finish_party. A film watched
-- together is a row with no season or episode.
create table public.together_progress (
  space_id uuid not null,
  watch_item_id uuid primary key,
  season integer check (season >= 0),
  episode integer check (episode >= 0),
  updated_at timestamptz not null default now(),
  check ((season is null) = (episode is null)),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete cascade
);

alter table public.episode_watches enable row level security;
alter table public.together_progress enable row level security;

create policy episode_watches_select on public.episode_watches for select to authenticated
  using (public.is_space_member(space_id));
create policy together_progress_select on public.together_progress for select to authenticated
  using (public.is_space_member(space_id));

grant select on public.episode_watches to authenticated;
grant select on public.together_progress to authenticated;
