-- Who is coming. Rows go when the event goes or the person leaves the space; writes via RPCs.
create type public.event_rsvp as enum ('pending', 'going', 'maybe', 'declined');

create table public.calendar_event_attendees (
  space_id uuid not null,
  event_id uuid not null,
  user_id uuid not null,
  rsvp public.event_rsvp not null default 'pending',
  responded_at timestamptz,
  added_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id),
  foreign key (space_id, event_id) references public.calendar_events (space_id, id) on delete cascade,
  foreign key (space_id, user_id) references public.space_members (space_id, user_id)
    on delete cascade
);
create index calendar_event_attendees_user on public.calendar_event_attendees (space_id, user_id);

alter table public.calendar_event_attendees enable row level security;
create policy calendar_event_attendees_select on public.calendar_event_attendees
  for select to authenticated using (public.is_space_member(space_id));
revoke all on public.calendar_event_attendees from anon, authenticated;
grant select on public.calendar_event_attendees to authenticated;
