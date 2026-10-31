-- Space profile: owner-only edits through column grants; checks keep values safe to render.
begin;
select plan(16);

select tests.create_user('cus_ana');
select tests.create_user('cus_ben');
insert into public.spaces (id, name) values ('c5000000-0000-4000-8000-000000000001', 'Us');
insert into public.space_members (space_id, user_id, role) values
  ('c5000000-0000-4000-8000-000000000001', tests.user_id('cus_ana'), 'owner'),
  ('c5000000-0000-4000-8000-000000000001', tests.user_id('cus_ben'), 'member');

select is((select home_cards from public.spaces where id = 'c5000000-0000-4000-8000-000000000001'),
  array['notes', 'on_your_mind', 'calendar', 'continue_watching', 'coming_up', 'recommended',
    'activity'], 'new spaces show the default Home cards, with Something on your mind? after Notes');
select is((select (theme, week_starts_on, default_watch_intent, tagline)::text from public.spaces
  where id = 'c5000000-0000-4000-8000-000000000001'), '(,1,want_to_watch,"")',
  'theme follows the template, weeks start on Monday');

select tests.act_as('cus_ana');
select lives_ok($$ update public.spaces set tagline = 'Our place', description = 'Movies and plans',
  theme = 'ocean', accent_color = '#1a2b3c', icon = 'heart-handshake',
  home_cards = '{calendar,notes,on_your_mind}', default_watch_intent = 'watch_together', week_starts_on = 0
  where id = 'c5000000-0000-4000-8000-000000000001' $$, 'the owner customises the space');
select is((select (tagline, theme, accent_color, icon, home_cards)::text from public.spaces
  where id = 'c5000000-0000-4000-8000-000000000001'),
  '("Our place",ocean,#1a2b3c,heart-handshake,"{calendar,notes,on_your_mind}")',
  'the changes are stored');

select throws_ok($$ update public.spaces set accent_color = '#ABC'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'short hex is rejected');
select throws_ok($$ update public.spaces set accent_color = 'red'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'named colours are rejected');
select throws_ok($$ update public.spaces set home_cards = '{notes,notes}'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'duplicate cards are rejected');
select throws_ok($$ update public.spaces set home_cards = '{notes,weather}'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'unknown cards are rejected');
select throws_ok($$ update public.spaces set default_watch_intent = 'archived'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'archived is no default');
select throws_ok($$ update public.spaces set week_starts_on = 3
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'weeks start Sun or Mon');
select throws_ok($$ update public.spaces set tagline = repeat('x', 121)
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'taglines are short');
select throws_ok($$ update public.spaces set icon = 'Heart!'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null, 'icons are lucide keys');
select throws_ok($$ update public.spaces set avatar_path = 'x'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '42501', null,
  'media paths are not directly writable');

select tests.act_as('cus_ben');
update public.spaces set tagline = 'Hacked' where id = 'c5000000-0000-4000-8000-000000000001';
select tests.reset_role();
select is((select tagline from public.spaces where id = 'c5000000-0000-4000-8000-000000000001'),
  'Our place', 'a member changes nothing');
select throws_ok($$ update public.spaces set avatar_path = 'c5000000-0000-4000-8000-000000000001'
  || '/cover/a1000000-0000-4000-8000-000000000001.webp'
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null,
  'the avatar path must be in the avatar slot of its own space');
select throws_ok($$ update public.spaces set tagline = e'a\tb '
  where id = 'c5000000-0000-4000-8000-000000000001' $$, '23514', null,
  'taglines are trimmed and free of control characters');

select * from finish();
rollback;
