-- Private Realtime: only a party's members receive (select) and send (insert) on 'party:<id>',
-- for broadcast and presence alike, and only while the party is open.
begin;
select plan(14);
select tests.party_setup();
create temp table p (k text primary key, id uuid);
grant select on p to authenticated;
insert into p values ('a', tests.party_start('pt_ana')),
  ('b', tests.party_start('pt_cat', 'ba000000-0000-4000-8000-000000000022', s => null, e1 => null,
    e2 => null));
select tests.act_as('pt_ben');
select public.join_party((select id from p where k = 'a'));
select tests.reset_role();
insert into realtime.messages (topic, extension, event, payload, private)
  select 'party:' || id, x, 'state', '{}', true from p, unnest(array['broadcast', 'presence']) x;

-- As who, on which party's topic: how many of that topic's messages of a kind are visible.
create function pg_temp.sees(who text, party text, kind text) returns int language plpgsql as $$
declare n int;
begin
  perform tests.act_as(who);
  perform set_config('realtime.topic', 'party:' || (select id from p where k = party), true);
  select count(*) into n from realtime.messages where topic = realtime.topic() and extension = kind;
  perform tests.reset_role();
  return n;
end $$;
create function pg_temp.send(who text, party text, kind text) returns void language plpgsql as $$
begin
  perform tests.act_as(who);
  perform set_config('realtime.topic', 'party:' || (select id from p where k = party), true);
  insert into realtime.messages (topic, extension, event, payload, private)
    values (realtime.topic(), kind, 'tick', '{}', true);
end $$;

select is(pg_temp.sees('pt_ben', 'a', 'broadcast'), 1, 'a member receives the party broadcast');
select is(pg_temp.sees('pt_ana', 'a', 'presence'), 1, 'the host receives presence');
select lives_ok($$ select pg_temp.send('pt_ben', 'a', 'broadcast') $$, 'a member broadcasts');
select tests.reset_role();
select lives_ok($$ select pg_temp.send('pt_ben', 'a', 'presence') $$, 'a member tracks presence');
select tests.reset_role();

select is(pg_temp.sees('pt_cat', 'a', 'broadcast'), 0, 'a member of another party hears nothing');
select is(pg_temp.sees('pt_cat', 'a', 'presence'), 0, 'nor sees who is there');
select throws_ok($$ select pg_temp.send('pt_cat', 'a', 'broadcast') $$, '42501', null,
  'a member of another party cannot broadcast');
select tests.reset_role();
select throws_ok($$ select pg_temp.send('pt_eve', 'a', 'presence') $$, '42501', null,
  'another space cannot join presence');
select tests.reset_role();
select is(pg_temp.sees('pt_eve', 'a', 'broadcast'), 0, 'another space hears nothing');
select is(pg_temp.sees('pt_cat', 'b', 'broadcast'), 1, 'each party has its own topic');

select tests.act_as('pt_ben');
select set_config('realtime.topic', 'party:not-a-uuid', true);
select is((select count(*)::int from realtime.messages where topic = realtime.topic()), 0,
  'a malformed topic is refused quietly');
select tests.reset_role();

delete from public.space_members where user_id = tests.user_id('pt_ben');
select is(pg_temp.sees('pt_ben', 'a', 'broadcast'), 0, 'a removed member hears nothing');
select tests.act_as('pt_ana');
select public.cancel_party((select id from p where k = 'a'));
select tests.reset_role();
select is(pg_temp.sees('pt_ana', 'a', 'broadcast'), 0, 'a closed party is silent');
select throws_ok($$ select pg_temp.send('pt_ana', 'a', 'broadcast') $$, '42501', null,
  'nobody sends on a closed party');

select * from finish();
rollback;
