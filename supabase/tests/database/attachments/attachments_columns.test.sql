-- attachments columns: members read only what the app shows; storage paths and states stay server-side.
begin;
select plan(4);

select is(
  (select array_agg(c.attname::text order by c.attname) from pg_attribute c
    where c.attrelid = 'public.attachments'::regclass and c.attnum > 0 and not c.attisdropped
      and has_column_privilege('authenticated', c.attrelid, c.attnum, 'select')),
  array['bytes', 'created_at', 'filename', 'id', 'idea_id', 'space_id', 'uploader_id', 'verified_mime'],
  'authenticated reads only the listed attachment columns');

select ok(not has_column_privilege('authenticated', 'public.attachments', 'object_path', 'select'),
  'the storage object path is not readable by clients');

select tests.create_user('col_ana');
insert into public.spaces (id, name) values ('53000000-0000-4000-8000-000000000003', 'Cols');
insert into public.space_members (space_id, user_id, role)
  values ('53000000-0000-4000-8000-000000000003', tests.user_id('col_ana'), 'owner');
insert into public.ideas (id, space_id, title)
  values ('13000000-0000-4000-8000-000000000003', '53000000-0000-4000-8000-000000000003', 'Idea');
insert into public.attachments
  (id, space_id, idea_id, uploader_id, filename, declared_mime, verified_mime, bytes, status, finalized_at)
values ('a3000000-0000-4000-8000-000000000003', '53000000-0000-4000-8000-000000000003',
  '13000000-0000-4000-8000-000000000003', tests.user_id('col_ana'), 'a.png', 'image/png',
  'image/png', 10, 'ready', now());

select tests.act_as('col_ana');
select is(
  (select filename from public.attachments where id = 'a3000000-0000-4000-8000-000000000003'),
  'a.png', 'a member still lists ready attachments through RLS');
select throws_ok(
  $$select object_path from public.attachments$$, '42501', null,
  'selecting the object path is refused');

select * from finish();
rollback;
