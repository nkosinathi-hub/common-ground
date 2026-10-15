-- Deleting a space needs the owner, a sign-in from the last five minutes and the exact name,
-- and leaves no row behind in any table that belongs to the space.
begin;
select plan(7);

select tests.create_user('del_ana'), tests.create_user('del_ben');
insert into public.spaces (id, name) values ('00000000-0000-0000-0000-0000000005d1', 'Doomed');
insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000005d1', tests.user_id('del_ana'), 'owner'),
  ('00000000-0000-0000-0000-0000000005d1', tests.user_id('del_ben'), 'member');

create function pg_temp.act_fresh(handle text, age int) returns void language sql as $$
  select tests.act_as(handle);
  select set_config('request.jwt.claims', json_build_object('sub', tests.user_id(handle),
    'role', 'authenticated', 'iat', extract(epoch from now())::bigint - age)::text, true);
$$;

select pg_temp.act_fresh('del_ana', 0);
insert into public.ideas (id, space_id, title) values
  ('00000000-0000-0000-0000-0000000005de', '00000000-0000-0000-0000-0000000005d1', 'Tea bar');
insert into public.idea_notes (space_id, idea_id, body)
  values ('00000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-0000000005de', 'n');
insert into public.tasks (space_id, idea_id, title)
  values ('00000000-0000-0000-0000-0000000005d1', '00000000-0000-0000-0000-0000000005de', 't');

select tests.act_as('del_ana');
select throws_ok($$ select public.delete_space('00000000-0000-0000-0000-0000000005d1', 'Doomed') $$,
  'P0001', 'please confirm your password again', 'a token without iat is not a recent sign-in');
select pg_temp.act_fresh('del_ana', 600);
select throws_ok($$ select public.delete_space('00000000-0000-0000-0000-0000000005d1', 'Doomed') $$,
  'P0001', 'please confirm your password again', 'a ten-minute-old sign-in is refused');
select pg_temp.act_fresh('del_ben', 0);
select throws_ok($$ select public.delete_space('00000000-0000-0000-0000-0000000005d1', 'Doomed') $$,
  '42501', null, 'a member who is not the owner cannot delete');
select pg_temp.act_fresh('del_ana', 0);
select throws_ok($$ select public.delete_space('00000000-0000-0000-0000-0000000005d1', 'Wrong') $$,
  'P0001', 'confirmation does not match the space name', 'the exact name is required');
select lives_ok($$ select public.delete_space('00000000-0000-0000-0000-0000000005d1', 'Doomed') $$,
  'a recently signed-in owner deletes with the exact name');

select tests.reset_role();
create function pg_temp.leftovers(target uuid) returns int language plpgsql as $$
declare tbl text; n int; total int := 0;
begin
  for tbl in select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'space_id' loop
    execute format('select count(*) from public.%I where space_id = $1', tbl) into n using target;
    total := total + n;
  end loop;
  return total;
end $$;
select is(pg_temp.leftovers('00000000-0000-0000-0000-0000000005d1'), 0, 'no table keeps rows of the space');
select is((select count(*)::int from public.profiles where id = tests.user_id('del_ben')), 1,
  'members keep their accounts');

select * from finish();
rollback;
