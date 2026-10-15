begin;
select plan(9);
select tests.collab_setup();
create temp table r (id uuid);
grant all on r to authenticated;

select tests.act_as('ana');
insert into r select unnest(public.recommend(tests.item('Frieren'), array[tests.user_id('ben')], ''));

select tests.act_as('cat');
select throws_ok($$ select public.respond_recommendation((select id from r), 'acknowledged') $$,
  '42501', null, 'another member cannot respond');

select tests.act_as('ben');
select throws_ok($$ update public.recommendations set status = 'dismissed' $$, '42501', null,
  'no direct update');
select lives_ok($$ select public.respond_recommendation((select id from r), 'acknowledged') $$,
  'recipient acknowledges');
select is((select status || ':' || (responded_at is not null) from public.recommendations),
  'acknowledged:true', 'response is recorded with a time');
select throws_ok($$ select public.respond_recommendation((select id from r), 'dismissed') $$,
  '42501', null, 'a response is final');
select is((select note from public.recommendations), null, 'blank note is stored as none');

select tests.act_as('ana');
select lives_ok($$ select public.recommend(tests.item('Frieren'), array[tests.user_id('ben')], null) $$,
  'can recommend again once the last one was answered');

select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('ben');
select tests.act_as('ben');
select is((select count(*) from public.recommendations)::int, 0, 'removed member sees none');
select throws_ok($$ select public.respond_recommendation(
  (select id from public.recommendations where status = 'pending' limit 1), 'dismissed') $$,
  '42501', null, 'removed member cannot respond');

select * from finish();
rollback;
