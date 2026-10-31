begin;
select plan(9);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('eve');
select tests.act_as('ana');
select public.create_space('Us', 'couple');
select tests.act_as('eve');
select public.create_space('Theirs', 'blank');
select tests.reset_role();
create temp table ids as select
  (select id from public.spaces where created_by = tests.user_id('ana')) as space_id,
  (select id from public.spaces where created_by = tests.user_id('eve')) as other_space, null::uuid as item_id;
grant select, update on ids to authenticated;
insert into public.space_members (space_id, user_id)
  values ((select space_id from ids), tests.user_id('ben'));

select tests.act_as('ana');
update ids set item_id = public.add_catalog_title((select space_id from ids), 'tv', 1, 'Show',
  'series', 2020, '', null, 'watch_together');
select public.save_watch_progress((select item_id from ids), 'watching', 1, 3, null);
select tests.act_as('ben');
select public.save_watch_progress((select item_id from ids), 'completed', 2, 10, '2026-10-01');

select is((select status::text from public.watch_progress where user_id = tests.user_id('ana')),
  'watching', 'completing alone never changes another member');
select is((select count(*) from public.watch_progress)::int, 2, 'members read everyone''s progress');
select throws_ok($$ select public.save_watch_progress((select item_id from ids), 'watching', 1, -1,
  null) $$, '23514', null, 'negative episode rejected');
select throws_ok($$ insert into public.watch_progress (watch_item_id, space_id, user_id, status)
  values ((select item_id from ids), (select space_id from ids), tests.user_id('ana'), 'dropped') $$,
  '42501', null, 'cannot write another member''s progress');
update public.watch_progress set status = 'dropped' where user_id = tests.user_id('ana');
select tests.reset_role();
select is((select status::text from public.watch_progress where user_id = tests.user_id('ana')),
  'watching', 'update of another member''s row has no effect');

select tests.act_as('eve');
select is((select count(*) from public.watch_progress)::int, 0, 'nonmember reads no progress');
select throws_ok($$ select public.save_watch_progress((select item_id from ids), 'watching', 1, 1,
  null) $$, 'P0002', null, 'nonmember cannot save progress on a guessed item');
select throws_ok($$ insert into public.watch_progress (watch_item_id, space_id, status)
  values ((select item_id from ids), (select other_space from ids), 'watching') $$, '23503', null,
  'cross-space parent rejected by the composite key');

select tests.reset_role();
select throws_ok($$ insert into public.watch_sessions (space_id, watch_item_id, created_by)
  values ((select other_space from ids), (select item_id from ids), tests.user_id('eve')) $$,
  '23503', null, 'session for another space''s title rejected');

select * from finish();
rollback;
