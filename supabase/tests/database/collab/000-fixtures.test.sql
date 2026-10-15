-- Runs before this folder's tests and is not rolled back.
-- Shared setup helpers for the collab tests.

-- Shared setup: ana owns "Us" with ben and cat; eve owns "Other". One title and one idea each.
create or replace function tests.collab_setup() returns void
language plpgsql security definer set search_path = '' as $$
declare us uuid; other uuid;
begin
  perform tests.create_user('ana');
  perform tests.create_user('ben');
  perform tests.create_user('cat');
  perform tests.create_user('eve');
  insert into public.spaces (name) values ('Us') returning id into us;
  insert into public.spaces (name) values ('Other') returning id into other;
  insert into public.space_members (space_id, user_id, role) values
    (us, tests.user_id('ana'), 'owner'), (us, tests.user_id('ben'), 'member'),
    (us, tests.user_id('cat'), 'member'), (other, tests.user_id('eve'), 'owner');
  insert into public.watch_items (space_id, title, media_type) values (us, 'Frieren', 'anime'), (other, 'Dune', 'movie');
  insert into public.ideas (space_id, title) values (us, 'Cafe'), (other, 'Bakery');
end $$;

create or replace function tests.space(space_name text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.spaces where name = space_name
$$;

create or replace function tests.item(item_title text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.watch_items where title = item_title
$$;

create or replace function tests.idea(idea_title text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.ideas where title = idea_title
$$;

grant execute on function tests.space(text), tests.item(text), tests.idea(text) to authenticated;

select plan(1);
select pass('fixtures installed');
select * from finish();
