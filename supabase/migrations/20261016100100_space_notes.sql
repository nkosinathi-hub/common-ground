-- Notes on Home: to one member or (recipient null) to everyone, with a flat reply thread and
-- per-person read state. Written through RPCs; authors edit, pin and delete their own.
create table public.space_notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  recipient_id uuid,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  pinned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint space_notes_expiry check (expires_at is null
    or expires_at between created_at and created_at + interval '90 days'),
  unique (space_id, id),
  -- A note to someone goes when they leave or are removed. Null (everyone) is not checked.
  foreign key (space_id, recipient_id) references public.space_members (space_id, user_id)
    on delete cascade
);
create index space_notes_home on public.space_notes (space_id, created_at desc, id desc);
create index space_notes_recipient on public.space_notes (recipient_id) where recipient_id is not null;

create trigger space_notes_updated_at before update on public.space_notes
  for each row execute function public.set_updated_at();

create table public.space_note_replies (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  note_id uuid not null,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  foreign key (space_id, note_id) references public.space_notes (space_id, id) on delete cascade
);
create index space_note_replies_thread on public.space_note_replies (note_id, created_at, id);

create table public.space_note_reads (
  note_id uuid not null references public.space_notes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (note_id, user_id)
);
create index space_note_reads_user on public.space_note_reads (user_id);

alter table public.space_notes enable row level security;
alter table public.space_note_replies enable row level security;
alter table public.space_note_reads enable row level security;

create policy space_notes_select on public.space_notes for select to authenticated using (
  public.is_space_member(space_id) and (recipient_id is null
    or recipient_id = (select auth.uid()) or author_id = (select auth.uid())));
create policy space_notes_update on public.space_notes for update to authenticated
  using (author_id = (select auth.uid()) and public.is_space_member(space_id))
  with check (author_id = (select auth.uid()));
create policy space_notes_delete on public.space_notes for delete to authenticated using (
  public.is_space_member(space_id) and (author_id = (select auth.uid())
    or (recipient_id is null and public.is_space_owner(space_id))));

-- Replies are visible exactly when their note is (the subquery runs under the notes policy).
create policy space_note_replies_select on public.space_note_replies for select to authenticated
  using (exists (select 1 from public.space_notes n where n.id = note_id));
create policy space_note_replies_delete on public.space_note_replies for delete to authenticated
  using (exists (select 1 from public.space_notes n where n.id = note_id)
    and (author_id = (select auth.uid()) or exists (select 1 from public.space_notes n
      where n.id = note_id and n.author_id = (select auth.uid()))));
create policy space_note_reads_select on public.space_note_reads for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.space_notes, public.space_note_replies, public.space_note_reads
  from anon, authenticated;
grant select, delete, update (body, pinned, expires_at) on public.space_notes to authenticated;
grant select, delete on public.space_note_replies to authenticated;
grant select on public.space_note_reads to authenticated;
