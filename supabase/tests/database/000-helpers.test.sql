-- Shared pgTAP helpers. Runs first and is NOT rolled back so later files can use them.
-- guard runs `supabase db reset` before `supabase test db`, so nothing leaks between runs.
create extension if not exists pgtap with schema extensions;
create schema if not exists tests;
grant usage on schema tests to authenticated, anon;

create or replace function tests.create_user(handle text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, email_confirmed_at)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          handle || '@test.local', jsonb_build_object('display_name', handle), now());
  return uid;
end $$;

create or replace function tests.user_id(handle text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from auth.users where email = handle || '@test.local'
$$;

create or replace function tests.act_as(handle text) returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', tests.user_id(handle), 'role', 'authenticated')::text, true);
end $$;

create or replace function tests.act_as_anon() returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

create or replace function tests.reset_role() returns void
language plpgsql set search_path = '' as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

grant execute on all functions in schema tests to authenticated, anon;

select plan(1);
select has_function('tests', 'act_as', array['text'], 'test helpers installed');
select * from finish();
