-- watch_opinions: like / dislike is private to its author and always sits in the title's space.
begin;
select plan(8);

select tests.create_user('op_ana'); select tests.create_user('op_ben'); select tests.create_user('op_eve');
select tests.act_as('op_ana');
create temp table ids (space_id uuid, other_space uuid, item uuid);
grant select, update on ids to authenticated;
insert into ids (space_id) select public.create_space('Opinions', 'couple');
select tests.act_as('op_eve');
update ids set other_space = public.create_space('Elsewhere', 'blank');
select tests.reset_role();
insert into public.space_members (space_id, user_id) values ((select space_id from ids), tests.user_id('op_ben')),
  ((select other_space from ids), tests.user_id('op_ana'));
select tests.act_as('op_ana');
update ids set item = public.add_catalog_title((select space_id from ids), 'tv', 9201, 'Show',
  'series', 2020, '', null, 'watch_together');

insert into public.watch_opinions (space_id, watch_item_id, opinion)
  values ((select space_id from ids), (select item from ids), 'liked');
select is((select user_id from public.watch_opinions), tests.user_id('op_ana'),
  'an opinion belongs to whoever gives it');
update public.watch_opinions set opinion = 'disliked';
select is((select opinion::text from public.watch_opinions), 'disliked', 'the author changes it');

select tests.act_as('op_ben');
select is((select count(*)::int from public.watch_opinions), 0, 'another member cannot read it');
update public.watch_opinions set opinion = 'liked';
select tests.act_as('op_ana');
select is((select opinion::text from public.watch_opinions), 'disliked',
  'another member cannot change it');

select tests.act_as('op_eve');
select throws_ok($$ insert into public.watch_opinions (space_id, watch_item_id, opinion)
  values ((select space_id from ids), (select item from ids), 'liked') $$, '42501', null,
  'a non-member cannot give one');
select tests.act_as('op_ana');
delete from public.watch_opinions;
select throws_ok($$ insert into public.watch_opinions (space_id, watch_item_id, opinion)
  values ((select other_space from ids), (select item from ids), 'liked') $$, '23503', null,
  'the space must be the title''s own');

select tests.reset_role();
select hasnt_column('public', 'watch_progress', 'rating', 'the star rating is gone');
select tests.act_as('op_ana');
select lives_ok($$ select public.save_watch_progress((select item from ids), 'watching', 1, 2, null) $$,
  'progress saves without a rating');

select * from finish();
rollback;
