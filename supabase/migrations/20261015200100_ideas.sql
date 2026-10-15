-- Ideas: quick capture, seven stages, tags, template and a structured overview (brief).
create type public.idea_stage as enum
  ('inbox', 'exploring', 'planning', 'building', 'launched', 'paused', 'archived');
create type public.idea_template as enum ('blank', 'business', 'creative');

-- The overview has fixed optional string fields, each at most 4000 characters.
create or replace function public.is_valid_idea_brief(brief jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(brief) = 'object' and not exists (
    select 1 from jsonb_each(brief) as field
    where field.key <> all (array['pitch', 'problem', 'audience', 'solution', 'valueProposition',
        'revenueModel', 'successMeasures', 'nextStep'])
      or jsonb_typeof(field.value) <> 'string'
      or char_length(field.value #>> '{}') > 4000
  );
$$;

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  stage public.idea_stage not null default 'inbox',
  tags text[] not null default '{}' check (cardinality(tags) <= 20),
  template public.idea_template not null default 'blank',
  brief jsonb not null default '{}' check (public.is_valid_idea_brief(brief)),
  currency text not null default 'ZAR' check (currency ~ '^[A-Z]{3}$'),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, id)
);

create index ideas_space_page on public.ideas (space_id, created_at desc, id desc);
create index ideas_tags on public.ideas using gin (tags);

create trigger ideas_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();

alter table public.ideas enable row level security;

create policy ideas_select on public.ideas for select to authenticated
  using (public.is_space_member(space_id));
create policy ideas_insert on public.ideas for insert to authenticated
  with check (public.is_space_member(space_id));
create policy ideas_update on public.ideas for update to authenticated
  using (public.is_space_member(space_id)) with check (public.is_space_member(space_id));
create policy ideas_delete on public.ideas for delete to authenticated
  using (public.is_space_member(space_id));

-- Supabase default privileges grant ALL to anon/authenticated; column grants below replace them.
revoke all on public.ideas from anon, authenticated;
grant select, delete on public.ideas to authenticated;
grant insert (id, space_id, title, stage, tags, template, brief) on public.ideas to authenticated;
grant update (title, stage, tags) on public.ideas to authenticated;
