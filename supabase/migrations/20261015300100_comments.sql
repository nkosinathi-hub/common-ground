-- Flat comment threads on a saved title or an idea. Plain text; writes only through RPCs.
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  watch_item_id uuid,
  idea_id uuid,
  author_id uuid default auth.uid()
    constraint comments_author_id_fkey references public.profiles (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  spoiler boolean not null default false,
  edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_one_parent check (num_nonnulls(watch_item_id, idea_id) = 1),
  constraint comments_watch_item_fkey foreign key (space_id, watch_item_id)
    references public.watch_items (space_id, id) on delete cascade,
  constraint comments_idea_fkey foreign key (space_id, idea_id)
    references public.ideas (space_id, id) on delete cascade
);

-- Keyset pagination per parent, newest first.
create index comments_watch_page on public.comments (watch_item_id, created_at desc, id desc)
  where watch_item_id is not null;
create index comments_idea_page on public.comments (idea_id, created_at desc, id desc)
  where idea_id is not null;
create index comments_space on public.comments (space_id);
create index comments_author on public.comments (author_id);

create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

alter table public.comments enable row level security;

create policy comments_select on public.comments for select to authenticated
  using (public.is_space_member(space_id));

grant select on public.comments to authenticated;
