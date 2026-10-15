-- A member recommends a saved title to another member, who acknowledges or dismisses it.
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  watch_item_id uuid not null,
  sender_id uuid default auth.uid()
    constraint recommendations_sender_id_fkey references public.profiles (id) on delete set null,
  recipient_id uuid not null
    constraint recommendations_recipient_id_fkey references public.profiles (id) on delete cascade,
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'acknowledged', 'dismissed')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint recommendations_watch_item_fkey foreign key (space_id, watch_item_id)
    references public.watch_items (space_id, id) on delete cascade,
  constraint recommendations_not_self check (recipient_id is distinct from sender_id),
  constraint recommendations_responded check ((status = 'pending') = (responded_at is null))
);

-- At most one outstanding recommendation per recipient and title.
create unique index recommendations_one_pending on public.recommendations
  (watch_item_id, recipient_id) where status = 'pending';
create index recommendations_inbox on public.recommendations
  (recipient_id, status, created_at desc, id desc);
create index recommendations_sender on public.recommendations (sender_id);
create index recommendations_space on public.recommendations (space_id);

alter table public.recommendations enable row level security;

create policy recommendations_select_own on public.recommendations for select to authenticated
  using (
    ((select auth.uid()) in (sender_id, recipient_id)) and public.is_space_member(space_id)
  );

grant select on public.recommendations to authenticated;
