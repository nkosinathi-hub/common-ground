-- delete_attachment: the uploader or the owner may delete; it hides the row and returns the path.
begin;
select plan(11);

select tests.create_user('ana'); select tests.create_user('bob'); select tests.create_user('eve');
insert into public.spaces (id, name) values ('51000000-0000-4000-8000-000000000001', 'Ours');
insert into public.space_members (space_id, user_id, role) values
  ('51000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'owner'),
  ('51000000-0000-4000-8000-000000000001', tests.user_id('bob'), 'member');
insert into public.ideas (id, space_id) values
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001');
insert into public.attachments
  (id, space_id, idea_id, uploader_id, filename, declared_mime, verified_mime, bytes, status, finalized_at)
select id::uuid, '51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001',
  tests.user_id(who), 'f.pdf', 'application/pdf', verified, 10, status::public.attachment_status, done
from (values
  ('a1000000-0000-4000-8000-000000000001', 'ana', 'application/pdf', 'ready', now()),
  ('a2000000-0000-4000-8000-000000000002', 'bob', 'application/pdf', 'ready', now()),
  ('a3000000-0000-4000-8000-000000000003', 'bob', 'application/pdf', 'ready', now()),
  ('a4000000-0000-4000-8000-000000000004', 'bob', null, 'pending', null)
) as r (id, who, verified, status, done);

select tests.act_as('eve');
select throws_ok($$ select public.delete_attachment('a1000000-0000-4000-8000-000000000001') $$,
  'P0002', null, 'a nonmember cannot delete (and learns nothing)');

select tests.act_as('bob');
select throws_ok($$ select public.delete_attachment('a1000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'a member cannot delete someone else''s file');
select is(public.delete_attachment('a2000000-0000-4000-8000-000000000002'),
  '51000000-0000-4000-8000-000000000001/11000000-0000-4000-8000-000000000001/a2000000-0000-4000-8000-000000000002',
  'the uploader deletes their file and gets its object path');
select throws_ok($$ select public.delete_attachment('a2000000-0000-4000-8000-000000000002') $$,
  'P0002', null, 'a deleted file cannot be deleted twice');
select throws_ok($$ select public.delete_attachment('a4000000-0000-4000-8000-000000000004') $$,
  'P0002', null, 'pending uploads are not deletable through the RPC');

select tests.act_as('ana');
select lives_ok($$ select public.delete_attachment('a3000000-0000-4000-8000-000000000003') $$,
  'the owner may delete a member''s file');

select tests.act_as('bob');
select is((select array_agg(id::text) from public.attachments),
  array['a1000000-0000-4000-8000-000000000001'], 'deleted files disappear for members');

select tests.act_as_anon();
select throws_ok($$ select public.delete_attachment('a1000000-0000-4000-8000-000000000001') $$,
  '42501', null, 'anon cannot call delete_attachment');
select tests.reset_role();

select is((select status::text from public.attachments where id = 'a2000000-0000-4000-8000-000000000002'),
  'rejected', 'a deleted row is marked for cleanup');
select is((select status::text from public.attachments where id = 'a1000000-0000-4000-8000-000000000001'),
  'ready', 'the refused delete left the row untouched');
select ok(not has_function_privilege('authenticated', 'public.cleanup_candidates()', 'execute'),
  'authenticated cannot list cleanup candidates');

select * from finish();
rollback;
