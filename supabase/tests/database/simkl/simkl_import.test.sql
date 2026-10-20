-- import_simkl_watches maps Simkl history by TMDB id onto the user's titles in every space she
-- belongs to, adds each watch once, and advances her cursor. Only the service role calls it.
begin;
select plan(12);

select tests.create_user('sk_ana');
select tests.create_user('sk_ben');
create temp table ids (home uuid, work uuid, other uuid);
grant select, insert, update on ids to authenticated;
select tests.act_as('sk_ana');
insert into ids (home, work) values (public.create_space('Home', 'couple'),
  public.create_space('Work', 'friends'));
select public.add_catalog_title((select home from ids), 'tv', 7101, 'Show', 'series', 2020, '',
  null, 'watch_together');
select public.add_catalog_title((select work from ids), 'tv', 7101, 'Show', 'series', 2020, '',
  null, 'watch_together');
select public.add_catalog_title((select home from ids), 'movie', 7102, 'Film', 'movie', 2020, '',
  null, 'watch_together');
select tests.act_as('sk_ben');
update ids set other = public.create_space('Ben', 'friends');
select public.add_catalog_title((select other from ids), 'tv', 7101, 'Show', 'series', 2020, '',
  null, 'watch_together');
select tests.reset_role();
insert into public.simkl_links (user_id, access_token) values (tests.user_id('sk_ana'), 'tok');

create temp table batch as select '[
  {"type": "tv", "tmdb": 7101, "season": 1, "episode": 1, "watched_at": "2026-01-01T20:00:00Z"},
  {"type": "tv", "tmdb": 7101, "season": 1, "episode": 2, "watched_at": "2026-01-02T20:00:00Z"},
  {"type": "movie", "tmdb": 7102, "watched_at": "2026-01-03T20:00:00Z"},
  {"type": "movie", "tmdb": 7101, "watched_at": "2026-01-04T20:00:00Z"},
  {"type": "tv", "tmdb": 9999999, "season": 1, "episode": 1, "watched_at": "2026-01-05T20:00:00Z"}
]'::jsonb as watches, tests.user_id('sk_ana') as ana, tests.user_id('sk_ben') as ben;
grant select on batch to authenticated, service_role;

select tests.act_as('sk_ana');
select throws_ok($$ select public.import_simkl_watches(tests.user_id('sk_ana'),
  (select watches from batch), now()) $$, '42501', null, 'clients cannot import history');
select tests.reset_role();

set local role service_role;
select is(public.import_simkl_watches((select ana from batch), (select watches from batch),
  '2026-02-01T00:00:00Z'), 5, 'two episodes in two spaces and the film: five rows');
select is(public.import_simkl_watches((select ana from batch), (select watches from batch),
  '2026-02-02T00:00:00Z'), 0, 'a re-sync adds nothing');
reset role;

select is((select count(*)::int from public.episode_watches e
  where e.user_id = tests.user_id('sk_ana') and e.source = 'simkl'), 5,
  'every imported row is marked simkl');
select is((select count(*)::int from public.episode_watches e
  where e.space_id = (select other from ids)), 0, 'a space she is not in gets nothing');
select is((select count(distinct e.space_id)::int from public.episode_watches e
  join public.watch_items w on w.id = e.watch_item_id
  where e.user_id = tests.user_id('sk_ana') and w.catalog_id = 7101), 2,
  'the show is ticked in both of her spaces');
select is((select count(*)::int from public.episode_watches e
  join public.watch_items w on w.id = e.watch_item_id
  where e.user_id = tests.user_id('sk_ana') and w.catalog_type = 'tv' and e.season is null), 0,
  'a film id never matches a series');
select is((select (season, episode, status::text) from public.watch_progress p
  join public.watch_items w on w.id = p.watch_item_id
  where p.user_id = tests.user_id('sk_ana') and w.space_id = (select home from ids)
    and w.catalog_id = 7101), (1, 2, 'watching'::text), 'her place moves forward');
select is((select status::text from public.watch_progress p
  join public.watch_items w on w.id = p.watch_item_id
  where p.user_id = tests.user_id('sk_ana') and w.catalog_id = 7102), 'completed',
  'the film is completed');
select is((select cursor from public.simkl_links where user_id = tests.user_id('sk_ana')),
  '2026-02-02T00:00:00Z'::timestamptz, 'the cursor advances to the latest activity');
select ok((select last_synced_at is not null from public.simkl_links
  where user_id = tests.user_id('sk_ana')), 'the sync time is recorded');

set local role service_role;
select throws_ok($$ select public.import_simkl_watches((select ben from batch), '[]', now()) $$,
  'P0002', null, 'a user without a link cannot be synced');
reset role;

select * from finish();
rollback;
