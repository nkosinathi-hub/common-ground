-- cleanup_candidates: abandoned pending uploads, rejected rows and orphaned objects.
begin;
select plan(4);

select tests.create_user('ana');
insert into public.spaces (id, name) values ('51000000-0000-4000-8000-000000000001', 'Ours');
insert into public.ideas (id, space_id) values
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001');
insert into public.attachments
  (id, space_id, idea_id, uploader_id, filename, declared_mime, verified_mime, bytes, status,
   created_at, finalized_at)
select id::uuid, '51000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001',
  tests.user_id('ana'), 'f.png', 'image/png', verified, 10, status::public.attachment_status,
  now() - age::interval, done
from (values
  ('a1000000-0000-4000-8000-000000000001', 'image/png', 'ready', '3 hours', now()),
  ('a2000000-0000-4000-8000-000000000002', null, 'pending', '10 minutes', null),
  ('a3000000-0000-4000-8000-000000000003', null, 'pending', '2 hours', null),
  ('a4000000-0000-4000-8000-000000000004', null, 'rejected', '1 minute', now())
) as r (id, verified, status, age, done);
insert into storage.objects (bucket_id, name, created_at) values
  ('attachments', '51000000-0000-4000-8000-000000000001/11000000-0000-4000-8000-000000000001/'
   || 'a1000000-0000-4000-8000-000000000001', now() - interval '3 hours'),
  ('attachments', '51000000-0000-4000-8000-000000000001/gone/old', now() - interval '2 hours'),
  ('attachments', '51000000-0000-4000-8000-000000000001/gone/new', now() - interval '5 minutes');

select is(
  (select array_agg(coalesce(attachment_id::text, '-') || ' ' || object_path order by object_path)
   from public.cleanup_candidates()),
  array[
    'a3000000-0000-4000-8000-000000000003 51000000-0000-4000-8000-000000000001/'
      || '11000000-0000-4000-8000-000000000001/a3000000-0000-4000-8000-000000000003',
    'a4000000-0000-4000-8000-000000000004 51000000-0000-4000-8000-000000000001/'
      || '11000000-0000-4000-8000-000000000001/a4000000-0000-4000-8000-000000000004',
    '- 51000000-0000-4000-8000-000000000001/gone/old'
  ],
  'old pending, rejected and orphaned objects are candidates; fresh and ready ones are not');

select tests.act_as('ana');
select throws_ok($$ select * from public.cleanup_candidates() $$, '42501', null,
  'members cannot list cleanup candidates');
select tests.act_as_anon();
select throws_ok($$ select * from public.cleanup_candidates() $$, '42501', null,
  'anon cannot list cleanup candidates');
select tests.reset_role();

set local role service_role;
select is((select count(*)::int from public.cleanup_candidates()), 3,
  'the service role lists cleanup candidates');
reset role;

select * from finish();
rollback;
