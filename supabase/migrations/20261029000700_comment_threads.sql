-- v0.6 (#77, D03 title discussion and D11): one level of replies, hearts, and an episode tag on
-- title comments so a viewer's place can hide what is ahead of them. Idempotent.
alter table public.comments
  add column if not exists reply_to uuid references public.comments (id) on delete cascade,
  add column if not exists season integer check (season >= 0),
  add column if not exists episode integer check (episode >= 1);
do $$ begin
  alter table public.comments add constraint comments_tag_whole
    check ((season is null) = (episode is null));
exception when duplicate_object then null; end $$;
create index if not exists comments_replies on public.comments (reply_to, created_at)
  where reply_to is not null;

create table if not exists public.comment_reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists comment_reactions_user on public.comment_reactions (user_id);
alter table public.comment_reactions enable row level security;
-- The comment is visible only to its space's members (comments_select), so seeing it is the test.
drop policy if exists comment_reactions_select on public.comment_reactions;
create policy comment_reactions_select on public.comment_reactions for select to authenticated
  using (exists (select 1 from public.comments c where c.id = comment_id));
drop policy if exists comment_reactions_insert on public.comment_reactions;
create policy comment_reactions_insert on public.comment_reactions for insert to authenticated
  with check (user_id = (select auth.uid())
    and exists (select 1 from public.comments c where c.id = comment_id));
drop policy if exists comment_reactions_delete on public.comment_reactions;
create policy comment_reactions_delete on public.comment_reactions for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.comment_reactions from anon, authenticated;
grant select, delete on public.comment_reactions to authenticated;
grant insert (comment_id) on public.comment_reactions to authenticated;
