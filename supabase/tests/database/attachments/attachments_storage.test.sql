-- Storage: private bucket; members read objects that have a finalized row; no client writes.
begin;
select plan(11);

select tests.create_user('ana'); select tests.create_user('eve');
insert into public.spaces (id, name) values
  ('51000000-0000-4000-8000-000000000001', 'Ours'), ('52000000-0000-4000-8000-000000000002', 'Theirs');
insert into public.space_members (space_id, user_id, role) values
  ('51000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'owner'),
  ('52000000-0000-4000-8000-000000000002', tests.user_id('eve'), 'owner');
insert into public.ideas (id, space_id) values
  ('11000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001');
insert into public.attachments
  (id, space_id, idea_id, uploader_id, filename, declared_mime, verified_mime, bytes, status, finalized_at)
values
  ('a1000000-0000-4000-8000-000000000001', '51000000-0000-4000-8000-000000000001',
   '11000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'a.png', 'image/png', 'image/png',
   10, 'ready', now()),
  ('a2000000-0000-4000-8000-000000000002', '51000000-0000-4000-8000-000000000001',
   '11000000-0000-4000-8000-000000000001', tests.user_id('ana'), 'b.png', 'image/png', null,
   10, 'pending', null);
insert into storage.objects (bucket_id, name)
select 'attachments', object_path from public.attachments
union all select 'attachments', '51000000-0000-4000-8000-000000000001/11000000-0000-4000-8000-000000000001/stray';

select is((select public from storage.buckets where id = 'attachments'), false, 'the bucket is private');
select is((select file_size_limit from storage.buckets where id = 'attachments'), 10485760::bigint,
  'the bucket caps files at 10 MB');
select is((select allowed_mime_types from storage.buckets where id = 'attachments'),
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], 'the bucket allows four types');

select tests.act_as('ana');
select is((select array_agg(name) from storage.objects where bucket_id = 'attachments'),
  (select array_agg(object_path) from public.attachments where status = 'ready'),
  'a member reads finalized objects only, not pending or stray ones');
select throws_ok($$ insert into storage.objects (bucket_id, name) values ('attachments',
  '51000000-0000-4000-8000-000000000001/11000000-0000-4000-8000-000000000001/mine') $$,
  '42501', null, 'members cannot insert objects directly');
update storage.objects set metadata = '{"hacked": true}' where bucket_id = 'attachments';
select ok(not public.can_read_attachment_object('52000000-0000-4000-8000-000000000002/'
  || '11000000-0000-4000-8000-000000000001/a1000000-0000-4000-8000-000000000001'),
  'a path whose first segment is another space is not readable');

select tests.act_as('eve');
select is((select count(*)::int from storage.objects where bucket_id = 'attachments'), 0,
  'a nonmember reads no objects');
select ok(not public.can_read_attachment_object(
  (select object_path from public.attachments where id = 'a1000000-0000-4000-8000-000000000001')),
  'a nonmember cannot read a known object path');

select tests.act_as_anon();
select is((select count(*)::int from storage.objects where bucket_id = 'attachments'), 0,
  'anon reads no objects');
select tests.reset_role();
select is((select count(*)::int from storage.objects where metadata ? 'hacked'), 0,
  'members cannot update objects');

update public.attachments set status = 'rejected' where id = 'a1000000-0000-4000-8000-000000000001';
select tests.act_as('ana');
select is((select count(*)::int from storage.objects where bucket_id = 'attachments'), 0,
  'a deleted or rejected file is unreadable at once');

select * from finish();
rollback;
