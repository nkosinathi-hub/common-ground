-- Spaces and memberships. Exactly one owner per space, enforced by a partial unique index.
create type public.space_template as enum ('couple', 'friends', 'family', 'blank');
create type public.space_role as enum ('owner', 'member');

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  template public.space_template not null default 'blank',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger spaces_updated_at before update on public.spaces
  for each row execute function public.set_updated_at();

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.space_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create unique index space_members_one_owner on public.space_members (space_id) where role = 'owner';
create index space_members_user on public.space_members (user_id);

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
