-- Watched-together log: when a title was watched and who was there. Written only by the RPC.
create table public.watch_sessions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  watch_item_id uuid not null,
  watched_on date not null default current_date,
  note text check (char_length(note) <= 500),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (space_id, id),
  foreign key (space_id, watch_item_id) references public.watch_items (space_id, id)
    on delete cascade
);
create index watch_sessions_item on public.watch_sessions (watch_item_id, watched_on desc);

create table public.watch_session_members (
  session_id uuid not null,
  space_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (session_id, user_id),
  foreign key (space_id, session_id) references public.watch_sessions (space_id, id)
    on delete cascade
);

alter table public.watch_sessions enable row level security;
alter table public.watch_session_members enable row level security;

create policy watch_sessions_select on public.watch_sessions for select to authenticated
  using (public.is_space_member(space_id));
create policy watch_session_members_select on public.watch_session_members for select
  to authenticated using (public.is_space_member(space_id));

grant select on public.watch_sessions to authenticated;
grant select on public.watch_session_members to authenticated;
