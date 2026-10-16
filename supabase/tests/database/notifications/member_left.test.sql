begin;
select plan(8);

select tests.create_user('pol_ana');
select tests.create_user('pol_ben');
select tests.create_user('pol_cy');
select tests.create_user('pol_dan');
select tests.create_user('pol_eve');
create temp table ctx (name text primary key, space_id uuid);
grant all on ctx to authenticated;
-- Every notification ever inserted, including ones a later cascade deletes again.
create temp table seen (recipient uuid, space_id uuid, type text, subject uuid, dedup text);
grant all on seen to authenticated;
create function pg_temp.spy() returns trigger language plpgsql as $$
begin
  insert into seen values (new.recipient_id, new.space_id, new.type, new.subject_id,
    new.deduplication_key);
  return new;
end $$;
create trigger spy after insert on public.notifications for each row execute function pg_temp.spy();

select tests.act_as('pol_ana');
insert into ctx select 'home', public.create_space('Pol home', 'couple');
insert into ctx select 'gone', public.create_space('Pol gone', 'couple');
select tests.reset_role();
insert into public.space_members (space_id, user_id)
  select c.space_id, tests.user_id(h) from ctx c, unnest(array['pol_ben', 'pol_cy', 'pol_dan', 'pol_eve']) h;

-- leave: the owner hears, keyed on space, user and time
select tests.act_as('pol_ben');
select public.leave_space((select space_id from ctx where name = 'home'));
select tests.reset_role();
select is((select count(*)::int from seen where recipient = tests.user_id('pol_ana')
    and type = 'member_left' and subject = tests.user_id('pol_ben')
    and dedup like 'member_left:' || (select space_id from ctx where name = 'home') || ':'
      || tests.user_id('pol_ben') || ':%'), 1, 'owner is notified when a member leaves');
select is((select count(*)::int from seen where recipient = tests.user_id('pol_ben')), 0,
  'the member who left is not notified');

-- removed without the owner acting (the account is deleted): the owner hears
insert into ctx values ('cy', tests.user_id('pol_cy'));
select set_config('request.jwt.claims', '', true);
delete from auth.users where id = tests.user_id('pol_cy');
select is((select count(*)::int from seen where recipient = tests.user_id('pol_ana')
    and type = 'member_left' and subject = (select space_id from ctx where name = 'cy')
    and space_id = (select space_id from ctx where name = 'home')),
  1,
  'owner is notified when a member is removed');

-- deleting their own account: the owner hears, with no actor left to point at
insert into ctx values ('eve', tests.user_id('pol_eve'));
select tests.act_as('pol_eve');
select set_config('request.jwt.claims', json_build_object('sub', tests.user_id('pol_eve'),
  'role', 'authenticated', 'iat', extract(epoch from now())::bigint)::text, true);
select public.delete_my_account();
select tests.reset_role();
select is((select count(*)::int from seen where recipient = tests.user_id('pol_ana')
    and subject = (select space_id from ctx where name = 'eve') and space_id = (select space_id
    from ctx where name = 'home')), 1, 'owner is notified when a member deletes their account');

-- removed by the owner: the owner is the actor, so public.notify skips them
select tests.act_as('pol_ana');
select public.remove_member((select space_id from ctx where name = 'home'), tests.user_id('pol_dan'));
select tests.reset_role();
select is((select count(*)::int from seen where subject = tests.user_id('pol_dan')
    and space_id = (select space_id from ctx where name = 'home')), 0,
  'an owner is not told about a removal they made themselves');
select is((select count(*)::int from seen where recipient = tests.user_id('pol_dan')
    and type = 'member_left'), 0, 'the removed member gets no member_left (see member_removed)');

-- deleting the space removes every member without a single member_left notification
-- (the account deletions above also told the owner about 'gone'; start the count afresh)
delete from seen;
select set_config('request.jwt.claims', '', true);
delete from public.spaces where id = (select space_id from ctx where name = 'gone');
select is((select count(*)::int from seen where space_id = (select space_id from ctx where name = 'gone')),
  0, 'no member_left notifications when the space is deleted');
select is((select count(*)::int from public.space_members
    where space_id = (select space_id from ctx where name = 'gone')), 0, 'the space is gone');

select * from finish();
rollback;
