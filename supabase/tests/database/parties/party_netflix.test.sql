-- A Netflix party (#66): each member plays it on netflix.com with the extension; the server
-- stores the source and nothing else, and every other rule of start_party holds.
begin;
select plan(6);
select tests.party_setup();

select isnt(tests.party_start('pt_ana', src => 'netflix'), null, 'a series party can be on netflix');
select is((select source::text from public.watch_parties
  where watch_item_id = 'ba000000-0000-4000-8000-000000000021' and status = 'planned'),
  'netflix', 'the party remembers it is on netflix');
select lives_ok($$ select tests.party_start('pt_ana', 'ba000000-0000-4000-8000-000000000022',
  'netflix', null, null, null) $$, 'a film party can be on netflix');
select throws_ok($$ select tests.party_start('pt_ben', src => 'jellyfin') $$, '23505', null,
  'still one open party per title, whatever the source');
select throws_ok($$ select tests.party_start('pt_eve', 'ba000000-0000-4000-8000-000000000021',
  'netflix') $$, 'P0002', null, 'a non-member still cannot start one');
select throws_ok($$ select tests.party_start('pt_eve', 'ba000000-0000-4000-8000-000000000023',
  'Netflix') $$, '22023', null, 'the source is still one of the known names, exactly');

select * from finish();
rollback;
