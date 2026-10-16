-- The recipient's one-tap responses to a "Something on my mind" note, seen by whoever sees the
-- note, and the gentle reminders a recipient may ask for, seen only by that recipient.
create table public.space_note_responses (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  note_id uuid not null,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  kind public.note_response_kind not null,
  created_at timestamptz not null default now(),
  foreign key (space_id, note_id) references public.space_notes (space_id, id) on delete cascade
);
create index space_note_responses_note on public.space_note_responses (note_id, created_at desc);

create table public.space_note_nudges (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  note_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  remind_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (space_id, note_id) references public.space_notes (space_id, id) on delete cascade
);
create index space_note_nudges_due on public.space_note_nudges (remind_at) where sent_at is null;
create index space_note_nudges_note on public.space_note_nudges (note_id, user_id);

alter table public.space_note_responses enable row level security;
alter table public.space_note_nudges enable row level security;

-- The subquery runs under the notes policy, so responses show exactly when their note does.
create policy space_note_responses_select on public.space_note_responses for select
  to authenticated using (exists (select 1 from public.space_notes n where n.id = note_id));
create policy space_note_nudges_select on public.space_note_nudges for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.space_note_responses, public.space_note_nudges from anon, authenticated;
grant select on public.space_note_responses, public.space_note_nudges to authenticated;
