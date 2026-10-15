-- catalog_cache and rate_limits are service-role only: RLS on, no policies, no grants.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values ('a1111111-1111-4111-8111-111111111111', 'ana@example.com');
insert into public.catalog_cache (cache_key, response, expires_at)
values ('search:dune:1', '{"results":[]}'::jsonb, now() + interval '15 minutes');
insert into public.rate_limits (user_id, bucket, window_start, count)
values ('a1111111-1111-4111-8111-111111111111', 'catalog', now(), 1);

select ok((select relrowsecurity from pg_class where oid = 'public.catalog_cache'::regclass),
  'catalog_cache has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.rate_limits'::regclass),
  'rate_limits has RLS enabled');
select is((select count(*)::int from pg_policies
  where schemaname = 'public' and tablename in ('catalog_cache', 'rate_limits')), 0,
  'no policies exist on service-only tables');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select throws_ok($$select * from public.catalog_cache$$, '42501', null,
  'authenticated cannot read catalog_cache');
select throws_ok($$insert into public.catalog_cache (cache_key, response, expires_at)
  values ('k', '{}', now())$$, '42501', null, 'authenticated cannot write catalog_cache');
select throws_ok($$delete from public.catalog_cache$$, '42501', null,
  'authenticated cannot delete catalog_cache');
select throws_ok($$select * from public.rate_limits$$, '42501', null,
  'authenticated cannot read rate_limits');
select throws_ok($$update public.rate_limits set count = 0$$, '42501', null,
  'authenticated cannot reset its own rate limit');
select throws_ok(
  $$select public.consume_rate_limit('a1111111-1111-4111-8111-111111111111', 'catalog', 30, 60)$$,
  '42501', null, 'authenticated cannot call consume_rate_limit');

reset role;
set local role anon;
select throws_ok($$select * from public.catalog_cache$$, '42501', null, 'anon cannot read catalog_cache');
select throws_ok($$select * from public.rate_limits$$, '42501', null, 'anon cannot read rate_limits');
reset role;

select * from finish();
rollback;
