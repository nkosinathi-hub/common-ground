-- The space look (#75): one validated JSON value, owner-only, plus the background picture slot.
begin;
select plan(14);

select tests.create_user('look_ana'); select tests.create_user('look_ben');
insert into public.spaces (id, name) values ('e7000000-0000-4000-8000-000000000001', 'Us');
insert into public.space_members (space_id, user_id, role) values
  ('e7000000-0000-4000-8000-000000000001', tests.user_id('look_ana'), 'owner'),
  ('e7000000-0000-4000-8000-000000000001', tests.user_id('look_ben'), 'member');

select is((select look from public.spaces where id = 'e7000000-0000-4000-8000-000000000001'),
  '{}'::jsonb, 'a new space has the default look');

select tests.act_as('look_ana');
select lives_ok($$ update public.spaces set look = '{"background":"#f2f3f7","card":"#ffffff",
  "button":"#1e6b66","backgroundStyle":"image","sidebar":"light","density":"compact",
  "corners":"rounded","headings":"sans","focusX":30,"focusY":70}'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, 'the owner sets every part of the look');
select is((select look->>'button' from public.spaces where id = 'e7000000-0000-4000-8000-000000000001'),
  '#1e6b66', 'the look is stored');
select throws_ok($$ update public.spaces set look = '{"button":"#1E6B66"}'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '23514', null, 'colours are lowercase hex');
select throws_ok($$ update public.spaces set look = '{"button":null}'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '23514', null, 'a key present needs a value');
select throws_ok($$ update public.spaces set look = '{"corners":"pill"}'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '23514', null, 'only the three corner shapes');
select throws_ok($$ update public.spaces set look = '{"focusX":120}'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '23514', null, 'the focal point is 0 to 100');
select throws_ok($$ update public.spaces set look = '{"font":"comic"}'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '23514', null, 'unknown keys are rejected');
select throws_ok($$ update public.spaces set look = '[]'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '23514', null, 'the look is an object');
select throws_ok($$ update public.spaces set background_path = 'x'
  where id = 'e7000000-0000-4000-8000-000000000001' $$, '42501', null,
  'the background path changes only through set_space_media');

select tests.act_as('look_ben');
update public.spaces set look = '{"button":"#000000"}' where id = 'e7000000-0000-4000-8000-000000000001';
select tests.reset_role();
select is((select look->>'button' from public.spaces where id = 'e7000000-0000-4000-8000-000000000001'),
  '#1e6b66', 'a member cannot change the look');

insert into storage.objects (bucket_id, name) values ('space-media',
  'e7000000-0000-4000-8000-000000000001/background/e8000000-0000-4000-8000-000000000001.webp');
select tests.act_as('look_ana');
select is(public.set_space_media('e7000000-0000-4000-8000-000000000001', 'background',
  'e7000000-0000-4000-8000-000000000001/background/e8000000-0000-4000-8000-000000000001.webp'),
  null, 'the owner sets a background picture');
select is((select background_path from public.spaces where id = 'e7000000-0000-4000-8000-000000000001'),
  'e7000000-0000-4000-8000-000000000001/background/e8000000-0000-4000-8000-000000000001.webp',
  'the background path is stored');
select is((public.export_space('e7000000-0000-4000-8000-000000000001')->'space'->'look'->>'corners'),
  'rounded', 'the export includes the look');
select tests.reset_role();

select * from finish();
rollback;
