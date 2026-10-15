-- Idea attachments. Rows are written only by the attachments Edge Function (service role);
-- members read finalized rows. The storage object path is derived, never client supplied.
create type public.attachment_status as enum ('pending', 'ready', 'rejected');

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  uploader_id uuid references public.profiles (id) on delete set null default auth.uid(),
  object_path text generated always as
    (space_id::text || '/' || idea_id::text || '/' || id::text) stored unique,
  filename text not null
    check (char_length(btrim(filename)) between 1 and 200 and filename !~ '[[:cntrl:]/\\]'),
  declared_mime text not null
    check (declared_mime in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  verified_mime text
    check (verified_mime in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  bytes bigint not null check (bytes between 1 and 10485760),
  status public.attachment_status not null default 'pending',
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade,
  constraint attachments_ready_is_verified check (
    status <> 'ready'
    or (verified_mime = declared_mime and finalized_at is not null)
  )
);

create index attachments_idea on public.attachments (space_id, idea_id, created_at, id);
create index attachments_cleanup on public.attachments (created_at) where status <> 'ready';

alter table public.attachments enable row level security;

create policy attachments_select on public.attachments for select to authenticated
  using (status = 'ready' and public.is_space_member(space_id));

grant select on public.attachments to authenticated;
grant select, insert, update, delete on public.attachments to service_role;
