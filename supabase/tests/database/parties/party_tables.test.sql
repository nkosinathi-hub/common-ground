-- Party tables: space members read them, nobody writes them directly, other spaces see nothing.
begin;
select plan(12);
select tests.party_setup();
create temp table p (id uuid);
grant select on p to authenticated;
insert into p select tests.party_start('pt_ana', e2 => 2);

select has_table('public', 'watch_parties', 'watch_parties exists');
select has_table('public', 'watch_party_members', 'watch_party_members exists');
select has_table('public', 'together_progress', 'together_progress exists');
select has_table('public', 'episode_watches', 'episode_watches exists');

select tests.act_as('pt_ben');
select is((select count(*)::int from public.watch_parties where id = (select id from p)), 1,
  'a space member reads the party');
select is((select count(*)::int from public.watch_party_members where party_id = (select id from p)),
  1, 'a space member reads who is in it');
select throws_ok($$ insert into public.watch_parties (space_id, watch_item_id, host_id, source)
  values ('ba000000-0000-4000-8000-000000000001', 'ba000000-0000-4000-8000-000000000021',
  tests.user_id('pt_ben'), 'external') $$, '42501', null, 'parties are written only by the rpcs');
select throws_ok($$ insert into public.watch_party_members (party_id, space_id, user_id)
  values ((select id from p), 'ba000000-0000-4000-8000-000000000001', tests.user_id('pt_ben')) $$,
  '42501', null, 'members are written only by the rpcs');
select throws_ok($$ insert into public.together_progress (space_id, watch_item_id, season, episode)
  values ('ba000000-0000-4000-8000-000000000001', 'ba000000-0000-4000-8000-000000000021', 9, 9) $$,
  '42501', null, 'together progress is written only by finish_party');

select tests.act_as('pt_eve');
select is((select count(*)::int from public.watch_parties where id = (select id from p)), 0,
  'another space sees no party');
select is((select count(*)::int from public.watch_party_members where party_id = (select id from p)),
  0, 'another space sees no party members');
select tests.reset_role();

select ok(public.export_table_names() @> array['watch_parties', 'watch_party_members',
  'together_progress', 'episode_watches'], 'the space export carries the party tables');

select * from finish();
rollback;
