-- AUTH V2 columns on simkl_links: the refresh token, the pending device code and their expiry
-- times are readable and writable by no client role; a pending sign-in is invisible to its
-- owner until it connects; only the service role takes and releases the refresh lease.
begin;
select plan(14);

select tests.create_user('sk2_ana');
select tests.create_user('sk2_ben');
insert into public.simkl_links (user_id, device_code, device_expires_at)
  values (tests.user_id('sk2_ana'), 'device-ana', now() + interval '15 minutes');
insert into public.simkl_links (user_id, access_token, refresh_token, access_expires_at,
  connected_at)
  values (tests.user_id('sk2_ben'), 'at-ben', 'rt-ben', now() + interval '7 days', now());
create temp table who as select tests.user_id('sk2_ana') as ana, tests.user_id('sk2_ben') as ben;
grant select on who to service_role;

select ok(not has_column_privilege('authenticated', 'public.simkl_links', c, 'select'),
  'authenticated cannot select ' || c)
  from unnest(array['access_token', 'refresh_token', 'access_expires_at', 'device_code',
    'device_expires_at', 'refresh_lease_until']) c;
select ok(not has_table_privilege('authenticated', 'public.simkl_links', 'update'),
  'authenticated cannot update any column');
select ok(not has_table_privilege('authenticated', 'public.simkl_links', 'insert'),
  'authenticated cannot insert');

select tests.act_as('sk2_ana');
select is((select count(*)::int from public.simkl_links), 0,
  'a pending sign-in is not shown as a connection');
select throws_ok($$ select device_code from public.simkl_links $$, '42501', null,
  'the device code is unreadable');
select tests.act_as('sk2_ben');
select is((select count(*)::int from public.simkl_links), 1, 'a connected link is shown');
select tests.reset_role();

select tests.act_as('sk2_ben');
select throws_ok($$ select public.claim_simkl_refresh(tests.user_id('sk2_ben')) $$, '42501',
  null, 'clients cannot take the refresh lease');
select tests.reset_role();
set local role service_role;
select is(public.claim_simkl_refresh((select ben from who)), true, 'the first refresh wins');
select is(public.claim_simkl_refresh((select ben from who)), false,
  'a second refresh waits while the lease is held');
reset role;

select * from finish();
rollback;
