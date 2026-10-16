-- People on an idea follow it: comments and stage changes notify the author and collaborators.
begin;
select plan(7);
select tests.create_user(h) from unnest(array['if_ana', 'if_ben', 'if_cat', 'if_dan']) h;
insert into public.spaces (id, name) values ('e9000000-0000-4000-8000-000000000001', 'Us');
insert into public.space_members (space_id, user_id, role)
  select 'e9000000-0000-4000-8000-000000000001', tests.user_id(h), case when h = 'if_ana'
    then 'owner' else 'member' end::public.space_role from unnest(array['if_ana', 'if_ben', 'if_cat', 'if_dan']) h;
insert into public.ideas (id, space_id, title, created_by) values
  ('e9000000-0000-4000-8000-000000000011', 'e9000000-0000-4000-8000-000000000001', 'Cafe',
   tests.user_id('if_ben'));
insert into public.watch_items (id, space_id, title, media_type) values
  ('e9000000-0000-4000-8000-000000000021', 'e9000000-0000-4000-8000-000000000001', 'Dune', 'movie');
insert into public.idea_collaborators (space_id, idea_id, user_id, accepted_at)
  select 'e9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-000000000011',
    tests.user_id(h), case when h = 'if_cat' then now() end from unnest(array['if_cat', 'if_dan']) h;
create function pg_temp.got(kind text) returns text[] language sql as $$
  select coalesce(array_agg(replace(u.email, '@test.local', '') order by u.email), '{}')
  from public.notifications n join auth.users u on u.id = n.recipient_id where n.type = kind $$;

-- The trigger is deferred until the mentions exist; tests fire it with set constraints.
select tests.act_as('if_ana');
select public.post_comment('e9000000-0000-4000-8000-000000000001', 'idea',
  'e9000000-0000-4000-8000-000000000011', 'Love it @cat', false, array[tests.user_id('if_cat')]);
set constraints all immediate;
set constraints all deferred;
select tests.reset_role();
select is(pg_temp.got('idea_comment'), array['if_ben'],
  'participants hear about comments, except people the comment mentions');
select is(pg_temp.got('mention'), array['if_cat'], 'the mention is sent as before');

select tests.act_as('if_cat');
select public.post_comment('e9000000-0000-4000-8000-000000000001', 'idea',
  'e9000000-0000-4000-8000-000000000011', 'Thanks', false, null);
set constraints all immediate;
set constraints all deferred;
select tests.reset_role();
select is((select count(*)::int from public.notifications where type = 'idea_comment'
  and recipient_id = tests.user_id('if_cat')), 0, 'nobody hears about their own comment');
select is((select count(*)::int from public.notifications where type = 'idea_comment'
  and recipient_id = tests.user_id('if_ben') and subject_type = 'idea'
  and subject_id = 'e9000000-0000-4000-8000-000000000011'), 2, 'the author hears about each comment');

select tests.act_as('if_ana');
select public.post_comment('e9000000-0000-4000-8000-000000000001', 'watch',
  'e9000000-0000-4000-8000-000000000021', 'Great film', false, null);
set constraints all immediate;
set constraints all deferred;
select tests.reset_role();
select is((select count(*)::int from public.notifications where type = 'idea_comment'), 2,
  'comments on titles notify nobody');

select tests.act_as('if_ana');
update public.ideas set stage = 'planning' where id = 'e9000000-0000-4000-8000-000000000011';
update public.ideas set title = 'Cafe 2' where id = 'e9000000-0000-4000-8000-000000000011';
select tests.reset_role();
select is(pg_temp.got('idea_stage_changed'), array['if_ben', 'if_cat'],
  'participants hear about stage changes; pending invitees do not');
select tests.act_as('if_ben');
update public.ideas set stage = 'building' where id = 'e9000000-0000-4000-8000-000000000011';
select tests.reset_role();
select is((select count(*)::int from public.notifications where type = 'idea_stage_changed'
  and recipient_id = tests.user_id('if_ben')), 1, 'the person changing the stage is not told');

select * from finish();
rollback;
