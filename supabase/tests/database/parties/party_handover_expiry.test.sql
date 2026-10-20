-- A member takes over a party whose host is gone; stale parties expire on pg_cron uncredited.
begin;
select plan(10);
select tests.party_setup();
create temp table p (k text primary key, id uuid);
grant select on p to authenticated;
insert into p values ('a', tests.party_start('pt_ana')),
  ('old', tests.party_start('pt_ana', 'ba000000-0000-4000-8000-000000000022', s => null,
    e1 => null, e2 => null));
create function pg_temp.host(key text) returns text language sql as $$
  select replace(u.email, '@test.local', '') from public.watch_parties w
  join auth.users u on u.id = w.host_id where w.id = (select id from p where k = key) $$;

select tests.act_as('pt_cat');
select throws_ok($$ select public.handover_party((select id from p where k = 'a')) $$, '42501',
  null, 'someone not in the party cannot take it over');
select tests.act_as('pt_ben');
select public.join_party((select id from p where k = 'a'));
select lives_ok($$ select public.handover_party((select id from p where k = 'a')) $$,
  'a member takes over');
select tests.reset_role();
select is(pg_temp.host('a'), 'pt_ben', 'the party records its new host');
select tests.act_as('pt_ben');
select throws_ok($$ select public.handover_party((select id from p where k = 'a')) $$, 'P0001',
  null, 'the host cannot take over from themselves');
select tests.act_as('pt_eve');
select throws_ok($$ select public.handover_party((select id from p where k = 'a')) $$, 'P0002',
  null, 'another space cannot take over');
select tests.reset_role();

select is((select count(*)::int from cron.job where jobname = 'watch-party-expiry'), 1,
  'stale parties expire on a schedule');
update public.watch_parties set created_at = now() - interval '7 hours'
  where id = (select id from p where k = 'old');
update public.watch_parties set status = 'live', started_at = now() - interval '1 hour'
  where id = (select id from p where k = 'a');
select is(public.expire_watch_parties(), 1, 'one stale party expires');
select is((select status::text from public.watch_parties where id = (select id from p where k = 'old')),
  'cancelled', 'a planned party nobody started is cancelled');
update public.watch_parties set started_at = now() - interval '13 hours'
  where id = (select id from p where k = 'a');
select public.expire_watch_parties();
select is((select status::text from public.watch_parties where id = (select id from p where k = 'a')),
  'cancelled', 'a live party left running for half a day is cancelled');
select is((select count(*)::int from public.episode_watches
  where party_id in (select id from p)), 0, 'an expired party credits nobody');

select * from finish();
rollback;
