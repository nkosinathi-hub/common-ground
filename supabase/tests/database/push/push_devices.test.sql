-- Push devices: each user sees and removes only their own tokens; a token belongs to one user.
begin;
select plan(14);

select tests.create_user('push_ana');
select tests.create_user('push_ben');

select has_table('public', 'push_devices', 'push_devices exists');
select ok((select relrowsecurity from pg_class where oid = 'public.push_devices'::regclass),
  'push_devices has RLS enabled');

select tests.act_as('push_ana');
select lives_ok($$select public.register_push_device('tok-ana-phone-0001', 'android')$$,
  'a user registers a device');
select lives_ok($$select public.register_push_device('tok-ana-phone-0001', 'android')$$,
  'registering the same token again is an upsert');
select is((select count(*)::int from public.push_devices), 1, 'the owner sees one row');
select throws_ok($$select public.register_push_device('tok-ana-phone-0002', 'ios')$$,
  '23514', null, 'only android is accepted');
select throws_ok($$select public.register_push_device('short', 'android')$$,
  '22023', null, 'an implausible token is refused');
select throws_ok($$insert into public.push_devices (user_id, token, platform)
  values (tests.user_id('push_ben'), 'tok-forged-device-01', 'android')$$,
  '42501', null, 'a direct insert cannot name another user');

-- the phone changes hands: the token moves to the new caller
select tests.act_as('push_ben');
select is((select count(*)::int from public.push_devices), 0, 'others cannot read the token');
select lives_ok($$select public.register_push_device('tok-ana-phone-0001', 'android')$$,
  'another user registers the same token');
select tests.reset_role();
select is((select user_id from public.push_devices where token = 'tok-ana-phone-0001'),
  tests.user_id('push_ben'), 'the token now belongs to the latest caller');

select tests.act_as('push_ana');
select is((select count(*)::int from public.push_devices), 0, 'the previous owner lost it');
select public.unregister_push_device('tok-ana-phone-0001');
select tests.reset_role();
-- as the superuser, count only this test's token: the local stack may hold real devices
select is((select count(*)::int from public.push_devices where token = 'tok-ana-phone-0001'), 1,
  'unregistering someone else''s token does nothing');

select tests.act_as('push_ben');
select public.unregister_push_device('tok-ana-phone-0001');
select tests.reset_role();
select is((select count(*)::int from public.push_devices where token = 'tok-ana-phone-0001'), 0,
  'the owner unregisters it');

select * from finish();
rollback;
