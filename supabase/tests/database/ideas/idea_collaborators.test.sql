-- Collaborators: invite, accept or decline, leave; "ours" marks ideas the caller shares.
begin;
select plan(18);
select tests.create_user(h) from unnest(array['ic_ana', 'ic_ben', 'ic_cat', 'ic_dan', 'ic_eve']) h;
insert into public.spaces (id, name) values
  ('e8000000-0000-4000-8000-000000000001', 'Us'), ('e8000000-0000-4000-8000-000000000002', 'Other');
insert into public.space_members (space_id, user_id, role)
  select 'e8000000-0000-4000-8000-000000000001'::uuid, tests.user_id(h), case when h = 'ic_ana'
    then 'owner' else 'member' end::public.space_role from unnest(array['ic_ana', 'ic_ben', 'ic_cat', 'ic_dan']) h
  union all select 'e8000000-0000-4000-8000-000000000002', tests.user_id('ic_eve'), 'owner';
insert into public.ideas (id, space_id, title, created_by) values
  ('e8000000-0000-4000-8000-000000000011', 'e8000000-0000-4000-8000-000000000001', 'Cafe',
   tests.user_id('ic_ben'));
create function pg_temp.ours_for(handle text) returns boolean language plpgsql as $$
declare r boolean;
begin
  perform tests.act_as(handle);
  select public.ours(i) into r from public.ideas i where i.id = 'e8000000-0000-4000-8000-000000000011';
  perform tests.reset_role();
  return r;
end $$;

select tests.act_as('ic_ben');
select lives_ok($$ select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_cat')) $$, 'the author invites a member');
select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011', tests.user_id('ic_cat'));
select throws_ok($$ select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_eve')) $$, 'P0001', null, 'only members can be invited');
select throws_ok($$ select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_ben')) $$, 'P0001', null, 'the author is not invited');
select throws_ok($$ insert into public.idea_collaborators (space_id, idea_id, user_id) values
  ('e8000000-0000-4000-8000-000000000001', 'e8000000-0000-4000-8000-000000000011',
   tests.user_id('ic_dan')) $$, '42501', null, 'invites go through the RPC');
select tests.reset_role();
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('ic_cat')
  and type = 'idea_invite' and subject_type = 'idea'), 1, 'the invitee is notified once');
select is(array[pg_temp.ours_for('ic_ben'), pg_temp.ours_for('ic_cat'), pg_temp.ours_for('ic_ana')],
  array[true, false, false], 'ours: the author yes, a pending invitee and others not');

select tests.act_as('ic_cat');
select public.respond_idea_invite('e8000000-0000-4000-8000-000000000011', true);
select throws_ok($$ select public.respond_idea_invite('e8000000-0000-4000-8000-000000000011', true) $$,
  'P0002', null, 'no pending invite to answer twice');
select is((select count(*)::int from public.ideas i where public.ours(i)), 1,
  'an accepted collaborator sees the idea as ours');
select lives_ok($$ select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_dan')) $$, 'a collaborator invites others');
select tests.reset_role();
select is((select count(*)::int from public.notifications where recipient_id = tests.user_id('ic_ben')
  and type = 'idea_invite_accepted'), 1, 'the inviter hears about the acceptance');
select is((select count(*)::int from public.activity_events where event_type = 'idea_collaborator_joined'),
  1, 'joining is recorded');
select is((select array_agg(u order by u) from public.idea_participants(
  'e8000000-0000-4000-8000-000000000011') u),
  (select array_agg(u order by u) from unnest(array[tests.user_id('ic_ben'), tests.user_id('ic_cat')]) u),
  'participants are the author and accepted collaborators');

select tests.act_as('ic_dan');
select public.respond_idea_invite('e8000000-0000-4000-8000-000000000011', false);
select is((select count(*)::int from public.idea_collaborators), 1, 'declining removes the invite');
select throws_ok($$ select public.remove_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_cat')) $$, '42501', null, 'others cannot remove a collaborator');
select tests.act_as('ic_eve');
select throws_ok($$ select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_eve')) $$, 'P0002', null, 'a nonmember cannot find the idea');
select is((select count(*)::int from public.idea_collaborators), 0, 'nor see its collaborators');

select tests.act_as('ic_cat');
select public.remove_idea_collaborator('e8000000-0000-4000-8000-000000000011', tests.user_id('ic_cat'));
select throws_ok($$ select public.remove_idea_collaborator('e8000000-0000-4000-8000-000000000011',
  tests.user_id('ic_cat')) $$, 'P0002', null, 'a collaborator leaves once');
select tests.act_as('ic_ana');
select public.invite_idea_collaborator('e8000000-0000-4000-8000-000000000011', tests.user_id('ic_dan'));
select public.remove_member('e8000000-0000-4000-8000-000000000001', tests.user_id('ic_dan'));
select is((select count(*)::int from public.idea_collaborators), 0,
  'the owner invites, and removing a member drops their invites');

select * from finish();
rollback;
