-- Push devices: grants, the per-user cap, account deletion, and the service-only target lookup.
begin;
select plan(10);

select tests.create_user('pr_ana');
select tests.create_user('pr_ben');
create temp table ctx (space_id uuid);
grant all on ctx to authenticated;

select tests.act_as('pr_ana');
insert into ctx select public.create_space('Push rules', 'couple');
select public.register_push_device('tok-pr-ana-device-' || n, 'android') from generate_series(1, 12) n;
select is((select count(*)::int from public.push_devices), 10,
  'a user keeps at most ten devices');
select ok(not exists (select 1 from public.push_devices where token in ('tok-pr-ana-device-1', 'tok-pr-ana-device-2')),
  'the oldest devices are dropped first');
select lives_ok($$delete from public.push_devices where token = 'tok-pr-ana-device-3'$$,
  'the owner deletes a row directly');
select throws_ok($$update public.push_devices set user_id = tests.user_id('pr_ben')$$,
  '42501', null, 'clients cannot update devices');
select throws_ok($$select * from public.push_targets(gen_random_uuid())$$,
  '42501', null, 'clients cannot call push_targets');

select tests.act_as_anon();
select throws_ok($$select * from public.push_devices$$, '42501', null, 'anon cannot read devices');
select throws_ok($$select public.register_push_device('tok-anon-device-0001', 'android')$$,
  '42501', null, 'anon cannot register a device');
select tests.reset_role();

-- the service role reads one notification with its recipient's tokens
insert into public.space_members (space_id, user_id) select space_id, tests.user_id('pr_ben') from ctx;
select set_config('request.jwt.claims', json_build_object('sub', tests.user_id('pr_ben'))::text, true);
select public.notify(tests.user_id('pr_ana'), (select space_id from ctx), 'mention', 'idea',
  (select space_id from ctx), 'pr-k1');
select set_config('request.jwt.claims', '', true);
set local role service_role;
select is((select count(*)::int from public.push_targets(
    (select id from public.notifications where deduplication_key = 'pr-k1'))
  where type = 'mention' and actor_name = 'pr_ben' and token like 'tok-pr-ana-%'), 9,
  'push_targets returns the notification once per recipient device');
reset role;

delete from auth.users where id = tests.user_id('pr_ana');
select is((select count(*)::int from public.push_devices), 0, 'deleting the account drops its devices');
select has_index('public', 'push_devices', 'push_devices_user', 'devices are indexed by user');

select * from finish();
rollback;
