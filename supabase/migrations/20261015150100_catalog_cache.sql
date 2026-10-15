-- TMDB response cache for the catalog Edge Function. Service role only: RLS on, no policies.
create table public.catalog_cache (
  cache_key text primary key check (char_length(cache_key) between 1 and 300),
  response jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index catalog_cache_expires_at on public.catalog_cache (expires_at);

alter table public.catalog_cache enable row level security;
revoke all on table public.catalog_cache from public, anon, authenticated;
grant select, insert, update, delete on table public.catalog_cache to service_role;
