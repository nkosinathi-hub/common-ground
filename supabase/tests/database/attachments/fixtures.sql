-- Test-only stand-in for public.ideas (owned by the ideas feature). Never a migration.
create table if not exists public.ideas (id uuid primary key default gen_random_uuid(), space_id uuid not null references public.spaces(id) on delete cascade, title text not null default 'x', unique (space_id, id));
