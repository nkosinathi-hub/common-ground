begin;
select plan(8);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('eve');
select tests.act_as('ana');
create temp table ctx (space_id uuid);
grant all on ctx to authenticated;
insert into ctx select public.create_space('Us', 'couple');
select tests.reset_role();
insert into public.space_members (space_id, user_id) select space_id, tests.user_id('ben') from ctx;

-- server-side notify as ana: ben is notified, eve (not a member) and ana (self) are not
select tests.act_as('ana');
select tests.reset_role();
select set_config('request.jwt.claims', json_build_object('sub', tests.user_id('ana'))::text, true);
select public.notify(tests.user_id('ben'), (select space_id from ctx), 'mention', 'space', (select space_id from ctx), 'k1');
select public.notify(tests.user_id('ben'), (select space_id from ctx), 'mention', 'space', (select space_id from ctx), 'k1');
select public.notify(tests.user_id('eve'), (select space_id from ctx), 'mention', 'space', (select space_id from ctx), 'k2');
select public.notify(tests.user_id('ana'), (select space_id from ctx), 'mention', 'space', (select space_id from ctx), 'k3');
select is((select count(*) from public.notifications where space_id = (select space_id from ctx))::int, 1, 'one deduplicated notification, only to a member who is not the actor');

select tests.act_as('ben');
select is((select count(*) from public.notifications)::int, 1, 'recipient sees it');
select lives_ok($$ update public.notifications set read_at = now() $$, 'recipient marks read');
select throws_ok($$ insert into public.notifications (recipient_id, space_id, type, subject_type, subject_id, deduplication_key)
  values (tests.user_id('ana'), (select space_id from public.space_members limit 1), 'mention', 'space', gen_random_uuid(), 'x') $$,
  '42501', null, 'clients cannot insert notifications');
select throws_ok($$ update public.notifications set recipient_id = tests.user_id('ana') $$, '42501', null,
  'clients cannot redirect notifications');

select tests.act_as('ana');
select is((select count(*) from public.notifications)::int, 0, 'others cannot read it');
update public.notifications set read_at = null;
select tests.reset_role();
select isnt((select read_at from public.notifications where space_id = (select space_id from ctx)), null, 'others cannot mark it unread');

select tests.act_as('eve');
select is((select count(*) from public.activity_events)::int, 0, 'nonmembers see no activity');

select * from finish();
rollback;
