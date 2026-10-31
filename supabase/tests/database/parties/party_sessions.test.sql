-- A finished party logs its own watched-together session: the range and who confirmed (v0.6).
begin;
select plan(4);
select tests.party_setup();
create temp table p (k text primary key, id uuid);
grant select on p to authenticated;
insert into p values ('night', tests.party_start('pt_ana', e1 => 2, e2 => 3));

select tests.act_as('pt_ben');
select public.join_party((select id from p)); select public.confirm_party((select id from p));
select tests.act_as('pt_ana');
select public.confirm_party((select id from p));
select public.finish_party((select id from p));
select tests.reset_role();

select is((select count(*)::int from public.watch_sessions where party_id = (select id from p)), 1,
  'the party logs one session');
select is((select from_season || ':' || from_episode || '-' || to_season || ':' || to_episode
  from public.watch_sessions where party_id = (select id from p)), '1:2-1:3',
  'with the episodes it covered');
select is((select array_agg(replace(u.email, '@test.local', '') order by u.email)
  from public.watch_session_members m join public.watch_sessions s on s.id = m.session_id
  join auth.users u on u.id = m.user_id where s.party_id = (select id from p)),
  array['pt_ana', 'pt_ben'], 'and only the people who confirmed');
select tests.act_as('pt_cat');
select is((select count(*)::int from public.watch_sessions where party_id = (select id from p)), 1,
  'every member of the space sees it');

select * from finish();
rollback;
