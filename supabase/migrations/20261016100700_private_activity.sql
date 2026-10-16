-- Activity with an audience: visible_to null is the space-wide feed, as before; otherwise only the
-- listed people see the entry. target_id names the other person, for "You shared ... with Ben".
alter table public.activity_events
  add column visible_to uuid[],
  add column target_id uuid references public.profiles (id) on delete set null;

drop policy activity_select on public.activity_events;
create policy activity_select on public.activity_events for select to authenticated
  using (public.is_space_member(space_id)
    and (visible_to is null or (select auth.uid()) = any (visible_to)));

-- Internal: an entry only the caller and `target` see.
create or replace function public.record_private_activity(
  target_space uuid, kind text, subject_kind text, subject uuid, target uuid
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.activity_events
    (space_id, actor_id, event_type, subject_type, subject_id, visible_to, target_id)
  values (target_space, (select auth.uid()), kind, subject_kind, subject,
    array[(select auth.uid()), target], target);
$$;

revoke execute on function public.record_private_activity(uuid, text, text, uuid, uuid)
  from public, anon, authenticated;

-- PostgREST computed field: activity_events?select=*,by_me. True when the viewer is the actor.
create or replace function public.by_me(public.activity_events)
returns boolean
language sql
stable
set search_path = ''
as $$
  select $1.actor_id = (select auth.uid());
$$;

revoke execute on function public.by_me(public.activity_events) from public, anon;
grant execute on function public.by_me(public.activity_events) to authenticated;

-- Taking a "Something on my mind" note back (or its recipient leaving) leaves no trace of it.
create or replace function public.space_notes_forget()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activity_events a
  where a.subject_type = 'space_note' and a.subject_id = old.id;
  delete from public.notifications x
  where x.subject_type = 'space_note' and x.subject_id = old.id;
  return old;
end;
$$;

revoke execute on function public.space_notes_forget() from public, anon, authenticated;

create trigger space_notes_forget after delete on public.space_notes
  for each row when (old.kind = 'hard_talk') execute function public.space_notes_forget();
