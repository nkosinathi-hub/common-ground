-- start_party tells the space, join and confirm add people, the host going ready starts it.
begin;
select plan(17);
select tests.party_setup();
create temp table p (id uuid);
grant select on p to authenticated;
insert into p select tests.party_start('pt_ana', e1 => 3, e2 => 4);
create function pg_temp.party() returns public.watch_parties language sql as $$
  select * from public.watch_parties where id = (select id from p) $$;

select is((pg_temp.party()).status::text, 'planned', 'a new party is planned');
select is((select array_agg(replace(u.email, '@test.local', '') order by u.email)
  from public.notifications n join auth.users u on u.id = n.recipient_id
  where n.type = 'watch_party' and n.subject_id = (select id from p)), array['pt_ben', 'pt_cat'],
  'every other space member hears that a party started');
select is((select count(*)::int from public.notifications where type = 'watch_party'
  and subject_id = (select id from p) and subject_type = 'watch_party'
  and actor_id = tests.user_id('pt_ana')), 2, 'the notice names the party and its host');
select is((select confirmed from public.watch_party_members where party_id = (select id from p)
  and user_id = tests.user_id('pt_ana')), false, 'the host is in, not yet ready');

select throws_ok($$ select tests.party_start('pt_ben') $$, '23505', null,
  'one open party per title');
select throws_ok($$ select tests.party_start('pt_eve') $$, 'P0002', null,
  'a non-member cannot start a party on a guessed title');
select throws_ok($$ select tests.party_start('pt_ana', 'ba000000-0000-4000-8000-000000000022',
  'sideways') $$, '22023', null, 'the source is jellyfin or external');
select throws_ok($$ select tests.party_start('pt_ana', e1 => 5, e2 => 2) $$, '22023', null,
  'a range never runs backwards');

select tests.act_as('pt_eve');
select throws_ok($$ select public.join_party((select id from p)) $$, 'P0002', null,
  'a non-member cannot join');
select tests.act_as('pt_ben');
select lives_ok($$ select public.join_party((select id from p)) $$, 'a member joins');
select lives_ok($$ select public.join_party((select id from p)) $$, 'joining twice is harmless');
select lives_ok($$ select public.confirm_party((select id from p)) $$, 'a member confirms');
select is((pg_temp.party()).status::text, 'planned', 'a guest confirming does not start it');
select throws_ok($$ select public.cancel_party((select id from p)) $$, '42501', null,
  'only the host cancels');

select tests.act_as('pt_ana');
select public.confirm_party((select id from p));
select is(((pg_temp.party()).status::text, (pg_temp.party()).started_at is not null),
  ('live'::text, true), 'the host confirming starts the party');
select public.cancel_party((select id from p));
select is(((pg_temp.party()).status::text, (pg_temp.party()).ended_at is not null),
  ('cancelled'::text, true), 'the host cancels it');
select tests.act_as('pt_ben');
select throws_ok($$ select public.join_party((select id from p)) $$, 'P0001', null,
  'a closed party cannot be joined');

select * from finish();
rollback;
