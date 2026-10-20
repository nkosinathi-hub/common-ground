-- finish_party credits only confirmed members; together moves only when everyone confirmed.
begin;
select plan(9);
select tests.party_setup();
create temp table p (k text primary key, id uuid);
grant select on p to authenticated;
insert into p values ('first', tests.party_start('pt_ana', e1 => 3, e2 => 4));
create function pg_temp.id(key text) returns uuid language sql as $$
  select id from p where k = key $$;
create function pg_temp.credited(party uuid) returns text language sql as $$
  select string_agg(replace(u.email, '@test.local', '') || ':S' || w.season || 'E' || w.episode,
    ',' order by u.email, w.season, w.episode)
  from public.episode_watches w join auth.users u on u.id = w.user_id
  where w.party_id = party and w.source = 'party' $$;
create function pg_temp.together() returns text language sql as $$
  select 'S' || season || 'E' || episode from public.together_progress
  where watch_item_id = 'ba000000-0000-4000-8000-000000000021' $$;
-- Everyone joins and confirms, the host last (which starts it), then the host finishes.
create function pg_temp.all_watch(party uuid) returns void language plpgsql as $$
begin
  perform tests.act_as('pt_ben'); perform public.join_party(party); perform public.confirm_party(party);
  perform tests.act_as('pt_cat'); perform public.join_party(party); perform public.confirm_party(party);
  perform tests.act_as('pt_ana'); perform public.confirm_party(party);
  perform public.finish_party(party); perform tests.reset_role();
end $$;

select tests.act_as('pt_ben');
select public.join_party(pg_temp.id('first'));
select public.confirm_party(pg_temp.id('first'));
select tests.act_as('pt_cat');
select public.join_party(pg_temp.id('first'));
select tests.act_as('pt_ana');
select throws_ok($$ select public.finish_party(pg_temp.id('first')) $$, 'P0001', null,
  'a party that never went live cannot be finished');
select public.confirm_party(pg_temp.id('first'));
select tests.act_as('pt_cat');
select throws_ok($$ select public.finish_party(pg_temp.id('first')) $$, '42501', null,
  'someone who never confirmed cannot finish it');
select tests.act_as('pt_eve');
select throws_ok($$ select public.finish_party(pg_temp.id('first')) $$, 'P0002', null,
  'another space cannot finish it');
select tests.act_as('pt_ben');
select lives_ok($$ select public.finish_party(pg_temp.id('first')) $$, 'a confirmed guest finishes');
select throws_ok($$ select public.finish_party(pg_temp.id('first')) $$, 'P0001', null,
  'a party is finished once');
select tests.reset_role();
select is(pg_temp.credited(pg_temp.id('first')), 'pt_ana:S1E3,pt_ana:S1E4,pt_ben:S1E3,pt_ben:S1E4',
  'only confirmed members are credited, one row per episode');
select is(pg_temp.together(), null, 'together waits until every member watched together');

insert into p values ('all', tests.party_start('pt_ana', e1 => 3, e2 => 4));
select pg_temp.all_watch(pg_temp.id('all'));
select is(pg_temp.together(), 'S1E4', 'everyone watching moves together to the last episode');
insert into p values ('rewatch', tests.party_start('pt_ana', e1 => 1, e2 => 2));
select pg_temp.all_watch(pg_temp.id('rewatch'));
select is(pg_temp.together(), 'S1E4', 'a rewatch behind together never moves it back');

select * from finish();
rollback;
