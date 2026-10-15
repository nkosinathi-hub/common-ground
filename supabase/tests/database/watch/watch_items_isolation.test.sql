begin;
select plan(12);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('eve');
select tests.act_as('ana');
select public.create_space('Us', 'couple');
select tests.reset_role();
create temp table ids as select (select id from public.spaces where created_by = tests.user_id('ana')) as space_id, null::uuid as item_id;
grant select, update on ids to authenticated;
insert into public.space_members (space_id, user_id)
  values ((select space_id from ids), tests.user_id('ben'));

select tests.act_as('ana');
update ids set item_id = public.add_catalog_title((select space_id from ids), 'movie', 438631,
  'Dune', 'movie', 2021, 'Spice.', '/dune.jpg', 'watch_together');
select tests.act_as('ben');
select is((select count(*) from public.watch_items)::int, 1, 'member sees the shared list');
select is((select created_by from public.watch_items), tests.user_id('ana'), 'author is the caller');

select tests.act_as('eve');
select is((select count(*) from public.watch_items)::int, 0, 'nonmember sees no titles');
select throws_ok($$ select public.add_catalog_title((select space_id from ids), 'movie', 1, 'X',
  'movie', null, '', null, 'want_to_watch') $$, '42501', null, 'nonmember cannot add via rpc');
select throws_ok($$ insert into public.watch_items (space_id, title, media_type)
  values ((select space_id from ids), 'Hack', 'movie') $$, '42501', null, 'nonmember cannot insert');
update public.watch_items set title = 'Hacked' where id = (select item_id from ids);
delete from public.watch_items where id = (select item_id from ids);
select is((select count(*) from public.list_watch_items((select space_id from ids)))::int, 0,
  'nonmember lists nothing');
select tests.reset_role();
select is((select title from public.watch_items where id = (select item_id from ids)), 'Dune',
  'guessed id update and delete do nothing');

select tests.act_as('ana');
select public.remove_member((select space_id from ids), tests.user_id('ben'));
select tests.act_as('ben');
select is((select count(*) from public.watch_items)::int, 0, 'removed member sees nothing');
select throws_ok($$ insert into public.watch_items (space_id, title, media_type)
  values ((select space_id from ids), 'Late', 'movie') $$, '42501', null, 'removed member cannot add');

select tests.act_as('ana');
select throws_ok($$ insert into public.watch_items (space_id, catalog_type, catalog_id, title,
  media_type) values ((select space_id from ids), 'movie', 7, 'Forged', 'movie') $$, '42501', null,
  'catalog columns are server-owned');
select is((select count(*) from public.activity_events where event_type = 'watch_item_added')::int,
  1, 'adding records activity');

select tests.act_as_anon();
select throws_ok($$ select count(*) from public.watch_items $$, '42501', null, 'anon has no access');

select * from finish();
rollback;
