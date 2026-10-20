-- Ranges cross a season boundary with the episode counts the client passed; films have no episode.
begin;
select plan(8);
select tests.party_setup();
create temp table p (k text primary key, id uuid);
grant select on p to authenticated;
create function pg_temp.id(key text) returns uuid language sql as $$
  select id from p where k = key $$;
create function pg_temp.watch(item uuid, s1 int, e1 int, s2 int, e2 int, counts int[]) returns uuid
language plpgsql as $$
declare party uuid;
begin
  perform tests.act_as('pt_ana');
  party := public.start_party(item, 'external', s1, e1, s2, e2, counts);
  foreach s1 in array array[1, 2] loop
    perform tests.act_as((array['pt_ben', 'pt_cat'])[s1]);
    perform public.join_party(party); perform public.confirm_party(party);
  end loop;
  perform tests.act_as('pt_ana'); perform public.confirm_party(party);
  perform public.finish_party(party); perform tests.reset_role();
  return party;
end $$;

insert into p values ('span', pg_temp.watch('ba000000-0000-4000-8000-000000000021', 1, 5, 2, 1,
  array[6]));
select is((select string_agg('S' || season || 'E' || episode, ',' order by season, episode)
  from public.episode_watches where party_id = pg_temp.id('span')
  and user_id = tests.user_id('pt_cat')), 'S1E5,S1E6,S2E1',
  'a range runs to the end of a season and on into the next');
select is((select 'S' || season || 'E' || episode from public.together_progress
  where watch_item_id = 'ba000000-0000-4000-8000-000000000021'), 'S2E1',
  'together lands in the later season');

select tests.act_as('pt_ana');
select throws_ok($$ select public.start_party('ba000000-0000-4000-8000-000000000021', 'external',
  1, 5, 3, 1, array[6]) $$, '22023', null, 'every season before the last needs its episode count');
select throws_ok($$ select public.start_party('ba000000-0000-4000-8000-000000000021', 'external',
  1, 7, 2, 1, array[6]) $$, '22023', null, 'a range cannot start past its season');
select throws_ok($$ select public.start_party('ba000000-0000-4000-8000-000000000021', 'external',
  null, null, null, null) $$, '22023', null, 'a series party names its episodes');
select throws_ok($$ select public.start_party('ba000000-0000-4000-8000-000000000022', 'external',
  1, 1, 1, 1) $$, '22023', null, 'a film party names no episodes');
select tests.reset_role();

insert into p values ('film', pg_temp.watch('ba000000-0000-4000-8000-000000000022', null, null,
  null, null, null));
select is((select count(*)::int from public.episode_watches where party_id = pg_temp.id('film')
  and season is null and episode is null), 3, 'a film watched together is one row per person');
select is((select count(*)::int from public.together_progress
  where watch_item_id = 'ba000000-0000-4000-8000-000000000022' and season is null), 1,
  'a film watched together is marked watched together, with no episode');

select * from finish();
rollback;
