-- Idea collaborators: attribution and follow notifications, no extra permissions (every member
-- already edits ideas). accepted_at null means the invite is pending. Writes go through RPCs.
create table public.idea_collaborators (
  space_id uuid not null,
  idea_id uuid not null,
  user_id uuid not null,
  invited_by uuid default auth.uid() references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (idea_id, user_id),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade,
  -- Leaving or being removed from the space ends the collaboration.
  foreign key (space_id, user_id) references public.space_members (space_id, user_id)
    on delete cascade
);
create index idea_collaborators_user on public.idea_collaborators (space_id, user_id);

alter table public.idea_collaborators enable row level security;
create policy idea_collaborators_select on public.idea_collaborators for select to authenticated
  using (public.is_space_member(space_id));
revoke all on public.idea_collaborators from anon, authenticated;
grant select on public.idea_collaborators to authenticated;

-- PostgREST computed field: ideas?select=*,ours and ideas?ours=is.true.
create or replace function public.ours(public.ideas)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce($1.created_by = (select auth.uid()), false) or exists (
    select 1 from public.idea_collaborators c
    where c.idea_id = $1.id and c.user_id = (select auth.uid()) and c.accepted_at is not null
  );
$$;
grant execute on function public.ours(public.ideas) to authenticated;

-- Internal: who follows an idea (its author and accepted collaborators).
create or replace function public.idea_participants(target_idea uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select i.created_by from public.ideas i where i.id = target_idea and i.created_by is not null
  union
  select c.user_id from public.idea_collaborators c
  where c.idea_id = target_idea and c.accepted_at is not null;
$$;
revoke execute on function public.idea_participants(uuid) from public, anon, authenticated;
