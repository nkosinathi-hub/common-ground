-- A space export holds exactly the rows the member can read: never other people's private notes,
-- their replies, recommendations or reminders.
begin;
select plan(7);
select tests.create_user(h) from unnest(array['exp_ana', 'exp_ben', 'exp_cat']) h;
insert into public.spaces (id, name) values ('eb000000-0000-4000-8000-000000000001', 'Us');
insert into public.space_members (space_id, user_id, role)
  select 'eb000000-0000-4000-8000-000000000001', tests.user_id(h), case when h = 'exp_ana'
    then 'owner' else 'member' end::public.space_role from unnest(array['exp_ana', 'exp_ben', 'exp_cat']) h;
insert into public.watch_items (id, space_id, title, media_type) values
  ('eb000000-0000-4000-8000-000000000021', 'eb000000-0000-4000-8000-000000000001', 'Dune', 'movie');
insert into public.ideas (id, space_id, title) values
  ('eb000000-0000-4000-8000-000000000031', 'eb000000-0000-4000-8000-000000000001', 'Cafe');
insert into public.recommendations (space_id, watch_item_id, sender_id, recipient_id, note)
  select 'eb000000-0000-4000-8000-000000000001', 'eb000000-0000-4000-8000-000000000021',
    tests.user_id('exp_ana'), tests.user_id(h), 'secret for ' || h from unnest(array['exp_ben', 'exp_cat']) h;
insert into public.space_notes (id, space_id, author_id, recipient_id, body) values
  ('eb000000-0000-4000-8000-000000000041', 'eb000000-0000-4000-8000-000000000001',
   tests.user_id('exp_ana'), tests.user_id('exp_cat'), 'Private to Cat'),
  ('eb000000-0000-4000-8000-000000000042', 'eb000000-0000-4000-8000-000000000001',
   tests.user_id('exp_ana'), null, 'For all'),
  ('eb000000-0000-4000-8000-000000000043', 'eb000000-0000-4000-8000-000000000001',
   tests.user_id('exp_cat'), tests.user_id('exp_ben'), 'Cat to Ben');
insert into public.space_note_replies (space_id, note_id, author_id, body)
  select 'eb000000-0000-4000-8000-000000000001', n, tests.user_id('exp_cat'), 'reply'
  from unnest(array['eb000000-0000-4000-8000-000000000041', 'eb000000-0000-4000-8000-000000000042',
    'eb000000-0000-4000-8000-000000000043']::uuid[]) n;
insert into public.calendar_events (id, space_id, title, time_zone, starts_at, ends_at, created_by,
  default_reminders) values ('eb000000-0000-4000-8000-000000000051',
  'eb000000-0000-4000-8000-000000000001', 'Party', 'UTC', now(), now(), tests.user_id('exp_cat'), '{5,10}');
select public.add_default_reminders('eb000000-0000-4000-8000-000000000051', tests.user_id('exp_ben'));

select tests.act_as('exp_ben');
create temp table dump as select public.export_space('eb000000-0000-4000-8000-000000000001') d;
select is((select array_agg(r ->> 'note') from dump, jsonb_array_elements(d #> '{tables,recommendations}') r),
  array['secret for exp_ben'], 'only recommendations the member sent or received');
select is((select array_agg(r ->> 'body' order by r ->> 'body') from dump,
  jsonb_array_elements(d #> '{tables,space_notes}') r), array['Cat to Ben', 'For all'],
  'no private notes between other people');
select is((select count(*)::int from dump, jsonb_array_elements(d #> '{tables,space_note_replies}') r
  where r ->> 'note_id' = 'eb000000-0000-4000-8000-000000000041'), 0, 'nor their replies');
select is((select count(*)::int from dump, jsonb_array_elements(d #> '{tables,calendar_event_reminders}') r
  where r ->> 'user_id' <> tests.user_id('exp_ben')::text), 0, 'nor other people''s reminders');
select ok((select d -> 'tables' ?& array['space_notes', 'space_note_replies', 'idea_collaborators',
  'calendar_events', 'calendar_event_attendees', 'calendar_event_reminders'] and not d -> 'tables'
  ? 'space_note_reads' from dump), 'the v0.2 tables are exported, read state is not');

-- Every exported table, compared with what the member reads under RLS (Ben is in one space).
create function pg_temp.mismatches() returns text[] language plpgsql as $$
declare tbl text; seen bigint; out text[] := '{}';
begin
  for tbl in select jsonb_object_keys(d -> 'tables') from dump loop
    execute format('select count(*) from public.%I', tbl) into seen;
    if seen <> (select jsonb_array_length(d -> 'tables' -> tbl) from dump) then
      out := out || tbl;
    end if;
  end loop;
  return out;
end $$;
select is(pg_temp.mismatches(), '{}', 'each table holds exactly the rows the member can select');
select ok((select jsonb_array_length(d #> '{tables,space_note_replies}') = 2
  and jsonb_array_length(d #> '{tables,calendar_event_reminders}') = 2 from dump),
  'the member''s own rows are all there');

select * from finish();
rollback;
