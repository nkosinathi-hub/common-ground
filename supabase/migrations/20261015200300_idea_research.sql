-- Research around an idea: plain-text notes, http(s) links and hypotheses.
create type public.hypothesis_status as enum ('untested', 'validated', 'invalidated');

create table public.idea_notes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 10000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade
);

create table public.research_links (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  url text not null check (url ~* '^https?://[^\s/$.?#][^\s]*$' and char_length(url) <= 2048),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade
);

create table public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  idea_id uuid not null,
  statement text not null check (char_length(btrim(statement)) between 1 and 1000),
  status public.hypothesis_status not null default 'untested',
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (space_id, idea_id) references public.ideas (space_id, id) on delete cascade
);

create index idea_notes_page on public.idea_notes (idea_id, created_at desc, id desc);
create index research_links_page on public.research_links (idea_id, created_at desc, id desc);
create index hypotheses_page on public.hypotheses (idea_id, created_at desc, id desc);

create trigger idea_notes_updated_at before update on public.idea_notes
  for each row execute function public.set_updated_at();
create trigger research_links_updated_at before update on public.research_links
  for each row execute function public.set_updated_at();
create trigger hypotheses_updated_at before update on public.hypotheses
  for each row execute function public.set_updated_at();

revoke all on public.idea_notes, public.research_links, public.hypotheses from anon, authenticated;
grant select, delete on public.idea_notes, public.research_links, public.hypotheses to authenticated;
grant insert (space_id, idea_id, body), update (body) on public.idea_notes to authenticated;
grant insert (space_id, idea_id, url, title, description), update (url, title, description)
  on public.research_links to authenticated;
grant insert (space_id, idea_id, statement, status), update (statement, status)
  on public.hypotheses to authenticated;
