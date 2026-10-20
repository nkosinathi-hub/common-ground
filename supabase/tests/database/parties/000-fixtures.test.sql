-- Runs before this folder's tests and is not rolled back.
-- pt_ana owns "Us" (ba..01) with pt_ben and pt_cat; pt_eve owns "Other" (ba..02).
-- Us holds a series (..21) and a movie (..22); Other holds a series (..23).
create or replace function tests.party_setup() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform tests.create_user(h) from unnest(array['pt_ana', 'pt_ben', 'pt_cat', 'pt_eve']) h;
  insert into public.spaces (id, name) values
    ('ba000000-0000-4000-8000-000000000001', 'Us'), ('ba000000-0000-4000-8000-000000000002', 'Other');
  insert into public.space_members (space_id, user_id, role) values
    ('ba000000-0000-4000-8000-000000000001', tests.user_id('pt_ana'), 'owner'),
    ('ba000000-0000-4000-8000-000000000001', tests.user_id('pt_ben'), 'member'),
    ('ba000000-0000-4000-8000-000000000001', tests.user_id('pt_cat'), 'member'),
    ('ba000000-0000-4000-8000-000000000002', tests.user_id('pt_eve'), 'owner');
  insert into public.watch_items (id, space_id, title, media_type) values
    ('ba000000-0000-4000-8000-000000000021', 'ba000000-0000-4000-8000-000000000001', 'Show', 'series'),
    ('ba000000-0000-4000-8000-000000000022', 'ba000000-0000-4000-8000-000000000001', 'Film', 'movie'),
    ('ba000000-0000-4000-8000-000000000023', 'ba000000-0000-4000-8000-000000000002', 'Theirs', 'series');
end $$;

-- Starts a party as the given user on a fixture item (..21 by default) for one season's range.
create or replace function tests.party_start(
  host text, item text default 'ba000000-0000-4000-8000-000000000021',
  src text default 'jellyfin', s int default 1, e1 int default 1, e2 int default 1
) returns uuid
language plpgsql set search_path = '' as $$
declare created uuid;
begin
  perform tests.act_as(host);
  created := public.start_party(item::uuid, src, s, e1, s, e2, null);
  perform tests.reset_role();
  return created;
end $$;

grant execute on function tests.party_start(text, text, text, int, int, int) to authenticated;

select plan(1);
select pass('party fixtures installed');
select * from finish();
