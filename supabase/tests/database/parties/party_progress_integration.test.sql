-- Parties and personal progress together: a finished party moves everyone's own place through
-- episode history (20261022000200) and the together pointer; watching alone afterwards moves
-- only that person. Fixtures: 000-fixtures (pt_ana, pt_ben, pt_cat share "Us", show ..21).
begin;
select plan(6);
select tests.party_setup();
create temp table p (id uuid);
grant select on p to authenticated;
insert into p select tests.party_start('pt_ana', e1 => 1, e2 => 2);

create function pg_temp.place(who text) returns text language sql as $$
  select 'S' || season || 'E' || episode || ' ' || status from public.watch_progress
  where watch_item_id = 'ba000000-0000-4000-8000-000000000021' and user_id = tests.user_id(who) $$;
create function pg_temp.together() returns text language sql as $$
  select 'S' || season || 'E' || episode from public.together_progress
  where watch_item_id = 'ba000000-0000-4000-8000-000000000021' $$;

select tests.act_as('pt_ben');
select public.join_party((select id from p));
select public.confirm_party((select id from p));
select tests.act_as('pt_cat');
select public.join_party((select id from p));
select public.confirm_party((select id from p));
select tests.act_as('pt_ana');
select public.confirm_party((select id from p));
select public.finish_party((select id from p));
select tests.reset_role();

select is(pg_temp.place('pt_ana'), 'S1E2 watching', 'the host''s own place moved to the last episode');
select is(pg_temp.place('pt_ben'), 'S1E2 watching', 'a guest''s own place moved too');
select is(pg_temp.together(), 'S1E2', 'together moved with everyone there');

-- Ben watches the next one alone.
select tests.act_as('pt_ben');
select public.mark_episode_watched('ba000000-0000-4000-8000-000000000021', 1, 3, 'player');
select tests.reset_role();
select is(pg_temp.place('pt_ben'), 'S1E3 watching', 'watching alone moves his own place');
select is(pg_temp.place('pt_ana'), 'S1E2 watching', 'and never hers');
select is(pg_temp.together(), 'S1E2', 'nor the together pointer');

select * from finish();
rollback;
