-- Watch parties: a host, a title, an episode range, and who is in. A jellyfin party plays in the
-- app in sync; an external one (#58) is a co-watch of playback elsewhere. Members read; every
-- write goes through the party RPCs. One open (planned or live) party per title.
create type public.party_source as enum ('jellyfin', 'external');
create type public.party_status as enum ('planned', 'live', 'ended', 'cancelled');

create table public.watch_parties (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  watch_item_id uuid not null,
  host_id uuid references public.profiles (id) on delete set null,
  source public.party_source not null,
  status public.party_status not null default 'planned',
  from_season integer check (from_season >= 0),
  from_episode integer check (from_episode >= 1),
  to_season integer,
  to_episode integer check (to_episode >= 1),
  -- Episodes in each season from from_season up to (not including) to_season, for a range that
  -- crosses a season boundary; the client passes them from TMDB.
  season_episode_counts integer[],
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (space_id, id),
  check (num_nulls(from_season, from_episode, to_season, to_episode) in (0, 4)),
  check ((to_season, to_episode) >= (from_season, from_episode)),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete cascade
);
create index watch_parties_item on public.watch_parties (watch_item_id, created_at desc);
create unique index watch_parties_one_open on public.watch_parties (watch_item_id)
  where status in ('planned', 'live');
create index watch_parties_open_age on public.watch_parties (created_at)
  where status in ('planned', 'live');

create table public.watch_party_members (
  party_id uuid not null,
  space_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  confirmed boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id),
  foreign key (space_id, party_id) references public.watch_parties (space_id, id) on delete cascade
);
create index watch_party_members_user on public.watch_party_members (user_id);

alter table public.episode_watches add constraint episode_watches_party_fkey
  foreign key (party_id) references public.watch_parties (id) on delete set null;
create index episode_watches_party on public.episode_watches (party_id);

alter table public.watch_parties enable row level security;
alter table public.watch_party_members enable row level security;

create policy watch_parties_select on public.watch_parties for select to authenticated
  using (public.is_space_member(space_id));
create policy watch_party_members_select on public.watch_party_members for select
  to authenticated using (public.is_space_member(space_id));

grant select on public.watch_parties to authenticated;
grant select on public.watch_party_members to authenticated;
