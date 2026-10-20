-- A new notification enqueues one pg_net call to the push function, and never fails the insert.
begin;
select plan(10);

select tests.create_user('pd_ana');
select tests.create_user('pd_ben');
create temp table ctx (space_id uuid);
grant all on ctx to authenticated;
select tests.act_as('pd_ana');
insert into ctx select public.create_space('Push delivery', 'couple');
select public.register_push_device('tok-pd-ana-device-01', 'android');
select tests.reset_role();
insert into public.space_members (space_id, user_id) select space_id, tests.user_id('pd_ben') from ctx;

create function pg_temp.notify_ana(dedup text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', tests.user_id('pd_ben'))::text, true);
  select public.notify(tests.user_id('pd_ana'), (select space_id from ctx), 'mention', 'idea',
    (select space_id from ctx), dedup);
  select set_config('request.jwt.claims', '', true);
$$;
create function pg_temp.queued() returns int language sql as $$
  select count(*)::int from net.http_request_queue where url = 'http://kong:8000/functions/v1/push'
$$;

select has_extension('pg_net', 'pg_net is installed');
select has_trigger('public', 'notifications', 'notifications_push', 'notifications have a push trigger');

-- not configured yet: nothing is sent, the insert still happens
delete from vault.secrets where name in ('push_function_url', 'push_secret');
select lives_ok($$select pg_temp.notify_ana('pd-k1')$$, 'insert works without push settings');
select is(pg_temp.queued(), 0, 'nothing is enqueued without push settings');

select throws_ok($$select public.configure_push('http://kong:8000/functions/v1/push', 'short')$$,
  '22023', null, 'a short push secret is refused');
select public.configure_push('http://kong:8000/functions/v1/push', repeat('s', 48));
select pg_temp.notify_ana('pd-k2');
select is((select count(*)::int from net.http_request_queue
   where url = 'http://kong:8000/functions/v1/push' and headers ->> 'x-push-secret' = repeat('s', 48)
     and convert_from(body, 'utf8')::jsonb = jsonb_build_object('notificationId',
       (select id from public.notifications where deduplication_key = 'pd-k2'))), 1,
  'a notification enqueues one authenticated call naming it');

-- a recipient with no devices costs no call
select set_config('request.jwt.claims', json_build_object('sub', tests.user_id('pd_ana'))::text, true);
select public.notify(tests.user_id('pd_ben'), (select space_id from ctx), 'mention', 'idea',
  (select space_id from ctx), 'pd-k3');
select set_config('request.jwt.claims', '', true);
select is(pg_temp.queued(), 1, 'no call for a recipient without devices');

-- a broken setting is swallowed: the notification is kept, no call is queued
select public.configure_push('http://[broken', repeat('s', 48));
select lives_ok($$select pg_temp.notify_ana('pd-k4')$$, 'a failing enqueue does not fail the insert');
select is((select count(*)::int from public.notifications where deduplication_key = 'pd-k4'), 1,
  'the notification is stored');
select is(pg_temp.queued(), 1, 'the failed call was not queued');

select * from finish();
rollback;
