begin;
select plan(13);

select tests.create_user('ana');
select tests.create_user('ben');
select tests.create_user('eve');

select tests.act_as('ana');
select public.create_space('Us', 'couple');
select tests.reset_role();
create temp table space_ref as select id from public.spaces where created_by = tests.user_id('ana');
grant select on space_ref to authenticated;
insert into public.space_members (space_id, user_id) select id, tests.user_id('ben') from space_ref;
insert into public.ideas (space_id, title, created_by)
  select id, 'Cafe', tests.user_id('ana') from space_ref;
insert into public.space_invites (space_id, token_hash, created_by)
  select id, decode(md5(gen_random_uuid()::text), 'hex'), tests.user_id('ana') from space_ref;
insert into public.notifications
  (recipient_id, space_id, type, subject_type, subject_id, deduplication_key)
  select tests.user_id('ben'), id, 'idea_added', 'idea', id, 'k1' from space_ref;

insert into public.attachments
  (space_id, idea_id, filename, declared_mime, verified_mime, bytes, status, finalized_at)
  select i.space_id, i.id, f, 'application/pdf', 'application/pdf', 3, st::public.attachment_status,
    case when st = 'ready' then now() end
  from public.ideas i join space_ref r on r.id = i.space_id,
    (values ('a.pdf', 'ready'), ('b.pdf', 'pending')) v (f, st);

select throws_ok($$ select public.export_space((select id from space_ref)) $$,
  '28000', null, 'signed-out callers cannot export');

select tests.act_as('ben');
select is(
  public.export_space((select id from space_ref)) -> 'space' ->> 'name', 'Us',
  'a member exports the space details');
select is(
  public.export_space((select id from space_ref)) #>> '{tables,ideas,0,title}', 'Cafe',
  'the export carries the space ideas');
select is(
  (select array_agg(m ->> 'display_name' order by m ->> 'display_name')
   from jsonb_array_elements(public.export_space((select id from space_ref)) -> 'members') m),
  array['ana', 'ben'], 'members carry display names');
select ok(
  public.export_space((select id from space_ref)) ? 'exported_at', 'export is timestamped');
select ok(
  not (public.export_space((select id from space_ref)) -> 'tables'
    ?| array['space_invites', 'notifications', 'rate_limits', 'catalog_cache']),
  'invites, notifications, rate limits and catalog cache are never exported');
select ok(
  not exists (
    select 1
    from jsonb_array_elements(
      public.export_space((select id from space_ref)) #> '{tables,attachments}') a,
      jsonb_object_keys(a) k
    where k not in ('id', 'filename', 'declared_mime', 'verified_mime', 'bytes', 'object_path')),
  'attachments are projected to safe columns');
select is(
  (public.export_space((select id from space_ref)) #> '{tables,attachments,0}') - 'id',
  jsonb_build_object('filename', 'a.pdf', 'declared_mime', 'application/pdf',
    'verified_mime', 'application/pdf', 'bytes', 3,
    'object_path', (select space_id || '/' || idea_id || '/' || id from public.attachments
      where filename = 'a.pdf')),
  'a finished upload is exported with its storage path');
select ok(
  not exists (
    select 1 from jsonb_array_elements(
      public.export_space((select id from space_ref)) #> '{tables,attachments}') a
    where a ->> 'filename' = 'b.pdf'),
  'attachments still uploading are not exported');
select ok(
  jsonb_typeof(public.export_space((select id from space_ref)) #> '{tables,activity_events}')
    = 'array', 'activity is exported');
select ok(
  jsonb_typeof(public.export_space((select id from space_ref)) #> '{tables,comment_mentions}')
    = 'array', 'comment mentions are exported through their comments');

select tests.act_as('eve');
select throws_ok($$ select public.export_space((select id from space_ref)) $$,
  '42501', null, 'a non-member cannot export');

select tests.reset_role();
delete from public.space_members where user_id = tests.user_id('ben');
select tests.act_as('ben');
select throws_ok($$ select public.export_space((select id from space_ref)) $$,
  '42501', null, 'a removed member cannot export');

select * from finish();
rollback;
