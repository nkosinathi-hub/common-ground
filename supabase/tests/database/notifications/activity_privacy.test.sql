-- Private activity: "Something on my mind" events are seen only by the two people involved.
begin;
select plan(9);
select tests.create_user(h) from unnest(array['ap_ana', 'ap_ben', 'ap_cat']) h;
insert into public.spaces (id, name) values ('ea000000-0000-4000-8000-000000000001', 'Us');
insert into public.space_members (space_id, user_id, role)
  select 'ea000000-0000-4000-8000-000000000001', tests.user_id(h), case when h = 'ap_ana'
    then 'owner' else 'member' end::public.space_role from unnest(array['ap_ana', 'ap_ben', 'ap_cat']) h;
insert into public.activity_events (space_id, actor_id, event_type, subject_type, subject_id)
  values ('ea000000-0000-4000-8000-000000000001', tests.user_id('ap_cat'), 'idea_created', 'idea',
  gen_random_uuid());
create temp table n (id uuid);
grant select, insert on n to authenticated;

select tests.act_as('ap_ana');
insert into public.space_note_drafts (space_id, recipient_id, sections) values
  ('ea000000-0000-4000-8000-000000000001', tests.user_id('ap_ben'), '{"feel": "hurt"}');
insert into n select (public.send_note_draft((select id from public.space_note_drafts))).id;
select tests.act_as('ap_ben');
select public.respond_to_note((select id from n), 'talk', null);

create function pg_temp.feed() returns text[] language sql as $$
  select coalesce(array_agg(a.event_type || ':' || public.by_me(a) order by a.created_at,
    a.event_type desc), '{}') from public.activity_events a where a.subject_type = 'space_note' $$;
select tests.act_as('ap_ana');
select is(pg_temp.feed(), array['hard_talk_shared:true', 'hard_talk_response:false'],
  'the author sees that they shared, and the response');
select is((select target_id from public.activity_events where event_type = 'hard_talk_shared'),
  tests.user_id('ap_ben'), 'naming who it was shared with');
select tests.act_as('ap_ben');
select is(pg_temp.feed(), array['hard_talk_shared:false', 'hard_talk_response:true'],
  'the recipient sees the same two entries from their side');
select tests.act_as('ap_cat');
select is(pg_temp.feed(), '{}'::text[], 'a third member sees no such entry');
select is((select count(*)::int from public.activity_events), 1,
  'while the space-wide feed stays as it was');
create temp table cat_dump as
  select public.export_space('ea000000-0000-4000-8000-000000000001') d;
select is((select jsonb_array_length(d #> '{tables,activity_events}') from cat_dump), 1,
  'nor does their export hold the private entries');
select tests.act_as('ap_ben');
select is((select count(*)::int from jsonb_array_elements((public.export_space(
  'ea000000-0000-4000-8000-000000000001')) #> '{tables,activity_events}')), 3,
  'the recipient''s export holds them');

select tests.act_as('ap_ana');
delete from public.space_notes where id = (select id from n);
select tests.reset_role();
select is((select count(*)::int from public.activity_events where subject_id = (select id from n)),
  0, 'taking it back removes its entries');
select is((select count(*)::int from public.notifications where subject_id = (select id from n)),
  0, 'and its notifications');

select * from finish();
rollback;
