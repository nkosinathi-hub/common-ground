-- Runs before this folder's tests and is not rolled back. Stand-ins are no-ops once the real tables exist.
-- Test-only stand-in for public.ideas (owned by the ideas feature). Never a migration.
create table if not exists public.ideas (id uuid primary key default gen_random_uuid(), space_id uuid not null references public.spaces(id) on delete cascade, title text not null default 'x', unique (space_id, id));

select plan(1);
select pass('fixtures installed');
select * from finish();
