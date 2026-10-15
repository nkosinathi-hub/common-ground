-- Cross-feature contract: notifications and activity are written only by server-side functions.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  type text not null check (type ~ '^[a-z_]{3,40}$'),
  subject_type text not null check (subject_type ~ '^[a-z_]{3,40}$'),
  subject_id uuid not null,
  actor_id uuid references public.profiles (id) on delete set null,
  deduplication_key text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, deduplication_key)
);
create index notifications_recipient on public.notifications (recipient_id, created_at desc);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z_]{3,40}$'),
  subject_type text not null check (subject_type ~ '^[a-z_]{3,40}$'),
  subject_id uuid not null,
  created_at timestamptz not null default now()
);
create index activity_events_space on public.activity_events (space_id, created_at desc);

-- Internal: call from triggers/RPCs only. Skips self-notification and non-members.
create or replace function public.notify(
  recipient uuid, target_space uuid, kind text, subject_kind text, subject uuid, dedup text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if recipient is null or recipient = (select auth.uid()) then return; end if;
  if not public.is_member_of(target_space, recipient) then return; end if;
  insert into public.notifications
    (recipient_id, space_id, type, subject_type, subject_id, actor_id, deduplication_key)
  values (recipient, target_space, kind, subject_kind, subject, (select auth.uid()), dedup)
  on conflict (recipient_id, deduplication_key) do nothing;
end;
$$;

create or replace function public.record_activity(
  target_space uuid, kind text, subject_kind text, subject uuid
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_events (space_id, actor_id, event_type, subject_type, subject_id)
  values (target_space, (select auth.uid()), kind, subject_kind, subject);
$$;

revoke execute on function public.notify(uuid, uuid, text, text, uuid, text) from public, authenticated;
revoke execute on function public.record_activity(uuid, text, text, uuid) from public, authenticated;

alter table public.notifications enable row level security;
alter table public.activity_events enable row level security;

create policy notifications_select_own on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy notifications_mark_read on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy activity_select on public.activity_events for select to authenticated
  using (public.is_space_member(space_id));

grant select, update (read_at) on public.notifications to authenticated;
grant select on public.activity_events to authenticated;
