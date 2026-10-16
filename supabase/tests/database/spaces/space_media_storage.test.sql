-- Space media: private bucket; members read, the owner uploads (quota 6) and deletes, no updates.
begin;
select plan(17);

select tests.create_user('med_ana'); select tests.create_user('med_ben'); select tests.create_user('med_eve');
insert into public.spaces (id, name) values
  ('d5000000-0000-4000-8000-000000000001', 'Us'), ('d5000000-0000-4000-8000-000000000002', 'Theirs');
insert into public.space_members (space_id, user_id, role) values
  ('d5000000-0000-4000-8000-000000000001', tests.user_id('med_ana'), 'owner'),
  ('d5000000-0000-4000-8000-000000000001', tests.user_id('med_ben'), 'member'),
  ('d5000000-0000-4000-8000-000000000002', tests.user_id('med_eve'), 'owner');
create function pg_temp.obj(space text, slot text, n int, ext text default 'webp') returns text
language sql immutable as $$
  select space || '/' || slot || '/e1000000-0000-4000-8000-' || lpad(n::text, 12, '0') || '.' || ext $$;

-- The Storage API sets this before deleting; RLS still decides which rows go.
select set_config('storage.allow_delete_query', 'true', true);

select is((select public from storage.buckets where id = 'space-media'), false, 'the bucket is private');
select is((select file_size_limit from storage.buckets where id = 'space-media'), 5242880::bigint,
  'the bucket caps files at 5 MB');
select is((select allowed_mime_types from storage.buckets where id = 'space-media'),
  array['image/jpeg', 'image/png', 'image/webp'], 'the bucket allows three image types');

select tests.act_as('med_ana');
select lives_ok($$ insert into storage.objects (bucket_id, name) values
  ('space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'avatar', 1)) $$,
  'the owner uploads an avatar');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000002', 'avatar', 2)) $$,
  '42501', null, 'not into another space prefix');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'avatar', 3, 'svg')) $$,
  '42501', null, 'no SVG');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'banner', 4)) $$,
  '42501', null, 'only the avatar and cover slots');
select lives_ok($$ insert into storage.objects (bucket_id, name)
  select 'space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'cover', n)
  from generate_series(10, 14) n $$, 'six objects fit the quota');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'cover', 15)) $$,
  '42501', null, 'the seventh object is over the quota');

select tests.act_as('med_ben');
select throws_ok($$ insert into storage.objects (bucket_id, name) values
  ('space-media', pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'cover', 20)) $$,
  '42501', null, 'members cannot upload');
select is((select count(*)::int from storage.objects where bucket_id = 'space-media'), 6,
  'members read the space media');
update storage.objects set metadata = '{"hacked": true}' where bucket_id = 'space-media';
delete from storage.objects where bucket_id = 'space-media';

select tests.act_as('med_eve');
select is((select count(*)::int from storage.objects where bucket_id = 'space-media'), 0,
  'a nonmember reads nothing');
select tests.act_as_anon();
select is((select count(*)::int from storage.objects where bucket_id = 'space-media'), 0,
  'anon reads nothing');

select tests.act_as('med_ana');
update storage.objects set metadata = '{"hacked": true}' where bucket_id = 'space-media';
select tests.reset_role();
select is((select count(*)::int from storage.objects where metadata ? 'hacked'), 0,
  'nobody updates objects');
select is((select count(*)::int from storage.objects where bucket_id = 'space-media'), 6,
  'members cannot delete');
select tests.act_as('med_ana');
delete from storage.objects
  where name = pg_temp.obj('d5000000-0000-4000-8000-000000000001', 'avatar', 1);
select tests.reset_role();
select is((select count(*)::int from storage.objects where bucket_id = 'space-media'), 5,
  'the owner deletes');
select is(public.space_media_space('d5000000-0000-4000-8000-000000000001/avatar/x.webp'), null,
  'a malformed path belongs to no space');

select * from finish();
rollback;
