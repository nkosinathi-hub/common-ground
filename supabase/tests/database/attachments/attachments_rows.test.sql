-- attachments rows: members read finalized rows only, no direct client writes, no cross-space.
begin;
select plan(16);

select tests.create_user('ana'); select tests.create_user('bob'); select tests.create_user('eve');
insert into public.spaces (id, name) values
  ('51000000-0000-4000-8000-000000000001', 'Ours'), ('52000000-0000-4000-8000-000000000002', 'Theirs');
insert into public.space_members (space_id, user_id, role) values
  ('51000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'owner'),
  ('51000000-0000-4000-8000-000000000001', tests.user_id('bob'), 'member'),
  ('52000000-0000-4000-8000-000000000002', tests.user_id('eve'), 'owner');
insert into public.ideas (id, space_id, title) values
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001', 'Idea'),
  ('12000000-0000-4000-8000-000000000002', '52000000-0000-4000-8000-000000000002', 'Idea');
insert into public.attachments
  (id, space_id, idea_id, uploader_id, filename, declared_mime, verified_mime, bytes, status, finalized_at)
values
  ('a1000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001',
   '11000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'plan.pdf', 'application/pdf',
   'application/pdf', 100, 'ready', now()),
  ('a2000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000001',
   '11000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'draft.png', 'image/png',
   null, 100, 'pending', null);

select ok((select relrowsecurity from pg_class where oid = 'public.attachments'::regclass),
  'attachments has RLS enabled');
select is((select object_path from public.attachments where id = 'a1000000-0000-4000-8000-000000000001'),
  '51000000-0000-4000-8000-000000000001/11000000-0000-4000-8000-000000000001/a1000000-0000-4000-8000-000000000001',
  'object path is <space>/<idea>/<id>');

select tests.act_as('bob');
select is((select count(*)::int from public.attachments), 1, 'member sees the finalized row only');
select is((select count(*)::int from public.attachments where status = 'pending'), 0,
  'pending rows are invisible to members');
select throws_ok($$ insert into public.attachments (space_id, idea_id, filename, declared_mime, bytes)
  values ('51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'x.pdf',
  'application/pdf', 10) $$, '42501', null, 'members cannot insert rows directly');
select throws_ok($$ update public.attachments set status = 'ready' $$, '42501', null,
  'members cannot update rows directly');
select throws_ok($$ delete from public.attachments $$, '42501', null,
  'members cannot delete rows directly');

select tests.act_as('eve');
select is((select count(*)::int from public.attachments), 0, 'nonmember sees no rows');
select tests.act_as_anon();
select throws_ok($$ select count(*) from public.attachments $$, '42501', null, 'anon has no access');
select tests.reset_role();

select throws_ok($$ insert into public.attachments (space_id, idea_id, filename, declared_mime, bytes)
  values ('52000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000001', 'x.pdf',
  'application/pdf', 10) $$, '23503', null, 'an idea from another space is rejected');
select throws_ok($$ insert into public.attachments (space_id, idea_id, filename, declared_mime, bytes)
  values ('51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'big.pdf',
  'application/pdf', 10485761) $$, '23514', null, 'files over 10 MB are rejected');
select throws_ok($$ insert into public.attachments (space_id, idea_id, filename, declared_mime, bytes)
  values ('51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'x.gif',
  'image/gif', 10) $$, '23514', null, 'types outside the allowlist are rejected');
select throws_ok($$ insert into public.attachments (space_id, idea_id, filename, declared_mime, bytes)
  values ('51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', '../x.pdf',
  'application/pdf', 10) $$, '23514', null, 'filenames with a path separator are rejected');
select throws_ok($$ insert into public.attachments
  (space_id, idea_id, filename, declared_mime, verified_mime, bytes, status, finalized_at)
  values ('51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'x.png',
  'image/png', 'application/pdf', 10, 'ready', now()) $$, '23514', null,
  'a row is ready only when the verified type matches the declared type');
select throws_ok($$ insert into public.attachments
  (space_id, idea_id, filename, declared_mime, bytes, status)
  values ('51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', 'x.png',
  'image/png', 10, 'ready') $$, '23514', null, 'a row cannot be ready without verification');

delete from public.ideas where id = '11000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::int from public.attachments
   where idea_id = '11000000-0000-4000-8000-000000000001'),
  0, 'deleting the idea deletes its rows');

select * from finish();
rollback;
