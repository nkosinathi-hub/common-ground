-- consume_rate_limit allows max calls per window, then blocks until the window passes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('b1111111-1111-4111-8111-111111111111', 'ben@example.com'),
  ('c1111111-1111-4111-8111-111111111111', 'cal@example.com');

set local role service_role;
select ok(public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'catalog', 2, 60),
  'first call is allowed');
select ok(public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'catalog', 2, 60),
  'second call reaches the limit and is allowed');
select ok(not public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'catalog', 2, 60),
  'third call within the window is blocked');
select ok(not public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'catalog', 2, 60),
  'calls stay blocked while the window lasts');
select ok(public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'other', 2, 60),
  'buckets are counted separately');
select ok(public.consume_rate_limit('c1111111-1111-4111-8111-111111111111', 'catalog', 2, 60),
  'users are counted separately');
reset role;

update public.rate_limits set window_start = now() - interval '61 seconds'
where user_id = 'b1111111-1111-4111-8111-111111111111' and bucket = 'catalog';

set local role service_role;
select ok(public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'catalog', 2, 60),
  'a new window allows calls again');
select is((select count from public.rate_limits
  where user_id = 'b1111111-1111-4111-8111-111111111111' and bucket = 'catalog'), 1,
  'the new window restarts the count');
select throws_ok(
  $$select public.consume_rate_limit('b1111111-1111-4111-8111-111111111111', 'catalog', 0, 60)$$,
  '22023', null, 'a non-positive limit is rejected');
reset role;

select * from finish();
rollback;
