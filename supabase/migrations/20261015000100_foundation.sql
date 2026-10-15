-- Extensions and shared trigger functions used by every feature.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Deny by default: Supabase grants every role full table access unless revoked.
-- Each table must grant exactly the columns and verbs it needs to `authenticated`.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;
revoke all on all tables in schema public from anon, authenticated;
revoke usage on schema public from anon;
