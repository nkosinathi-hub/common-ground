-- Following an idea: its author and accepted collaborators hear about new comments and stage
-- changes. Task and milestone notifications are unchanged.

-- Deferred to the end of the transaction because post_comment inserts the mentions after the
-- comment; people the comment mentions already get a 'mention' and are skipped here.
create or replace function public.ideas_notify_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare p uuid;
begin
  if new.idea_id is null then return null; end if;
  for p in select public.idea_participants(new.idea_id) loop
    if not exists (select 1 from public.comment_mentions m
      where m.comment_id = new.id and m.user_id = p) then
      perform public.notify(p, new.space_id, 'idea_comment', 'idea', new.idea_id,
        'idea_comment:' || new.id || ':' || p);
    end if;
  end loop;
  return null;
end;
$$;

create constraint trigger comments_notify_idea_followers after insert on public.comments
  deferrable initially deferred
  for each row execute function public.ideas_notify_comment();

create or replace function public.ideas_notify_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare p uuid;
begin
  if old.stage is not distinct from new.stage then return null; end if;
  for p in select public.idea_participants(new.id) loop
    perform public.notify(p, new.space_id, 'idea_stage_changed', 'idea', new.id,
      'idea_stage:' || new.id || ':' || p || ':' || floor(extract(epoch from new.updated_at))::bigint);
  end loop;
  return null;
end;
$$;

create trigger ideas_notify_stage after update of stage on public.ideas
  for each row execute function public.ideas_notify_stage();

revoke execute on function public.ideas_notify_comment() from public, anon, authenticated;
revoke execute on function public.ideas_notify_stage() from public, anon, authenticated;
