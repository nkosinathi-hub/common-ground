-- Runs before this folder's tests and is not rolled back.
-- nt_ana owns "Us" (e7..01) with nt_ben and nt_cat; nt_eve owns "Other" (e7..02).
create or replace function tests.notes_setup() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform tests.create_user(h) from unnest(array['nt_ana', 'nt_ben', 'nt_cat', 'nt_eve']) h;
  insert into public.spaces (id, name) values
    ('e7000000-0000-4000-8000-000000000001', 'Us'), ('e7000000-0000-4000-8000-000000000002', 'Other');
  insert into public.space_members (space_id, user_id, role) values
    ('e7000000-0000-4000-8000-000000000001', tests.user_id('nt_ana'), 'owner'),
    ('e7000000-0000-4000-8000-000000000001', tests.user_id('nt_ben'), 'member'),
    ('e7000000-0000-4000-8000-000000000001', tests.user_id('nt_cat'), 'member'),
    ('e7000000-0000-4000-8000-000000000002', tests.user_id('nt_eve'), 'owner');
end $$;

-- Posts a note as the given user and returns its id.
create or replace function tests.post_note(author text, recipient text, body text) returns uuid
language plpgsql set search_path = '' as $$
declare created uuid;
begin
  perform tests.act_as(author);
  select (public.post_note('e7000000-0000-4000-8000-000000000001',
    case when recipient is null then null else tests.user_id(recipient) end, body, false, null)).id
    into created;
  perform tests.reset_role();
  return created;
end $$;

grant execute on function tests.post_note(text, text, text) to authenticated;

select plan(1);
select pass('notes fixtures installed');
select * from finish();
