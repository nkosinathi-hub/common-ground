-- Any member sets who is invited (the caller always attends) or answers for themselves.
create or replace function public.set_event_attendees(event uuid, members uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid()); target public.calendar_events; wanted uuid[]; m uuid;
begin
  select * into target from public.calendar_events e where e.id = event
    and public.is_space_member(e.space_id);
  if target.id is null then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct u), '{}') into wanted from unnest(members) u where u is not null;
  if cardinality(wanted) > 50 then
    raise exception 'Invite at most 50 people' using errcode = 'P0001';
  end if;
  if exists (select 1 from unnest(wanted) u where not exists (select 1 from public.space_members s
    where s.space_id = target.space_id and s.user_id = u)) then
    raise exception 'Only members of this space can attend' using errcode = 'P0001';
  end if;
  wanted := array_append(array_remove(wanted, caller), caller);
  delete from public.calendar_event_reminders r
  where r.event_id = target.id and r.user_id <> all (wanted);
  delete from public.calendar_event_attendees a
  where a.event_id = target.id and a.user_id <> all (wanted);
  for m in
    insert into public.calendar_event_attendees (space_id, event_id, user_id, rsvp, responded_at, added_by)
    select target.space_id, target.id, u, case when u = caller then 'going' else 'pending' end::public.event_rsvp,
      case when u = caller then now() end, caller
    from unnest(wanted) u
    on conflict (event_id, user_id) do nothing
    returning user_id
  loop
    perform public.add_default_reminders(target.id, m);
    perform public.notify(m, target.space_id, 'event_invite', 'calendar_event', target.id,
      'event_invite:' || target.id || ':' || m);
  end loop;
end;
$$;

create or replace function public.rsvp_event(event uuid, response public.event_rsvp)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare caller uuid := (select auth.uid()); target public.calendar_events; joined boolean;
begin
  select * into target from public.calendar_events e where e.id = event
    and public.is_space_member(e.space_id);
  if target.id is null then
    raise exception 'You are not a member of this space' using errcode = '42501';
  end if;
  if response is null or response = 'pending' then
    raise exception 'Answer going, maybe or declined' using errcode = 'P0001';
  end if;
  joined := not exists (select 1 from public.calendar_event_attendees a
    where a.event_id = target.id and a.user_id = caller);
  insert into public.calendar_event_attendees (space_id, event_id, user_id, rsvp, responded_at, added_by)
  values (target.space_id, target.id, caller, response, now(), caller)
  on conflict (event_id, user_id) do update set rsvp = excluded.rsvp, responded_at = now();
  if joined and response <> 'declined' then
    perform public.add_default_reminders(target.id, caller);
  end if;
  perform public.notify(target.created_by, target.space_id, 'event_rsvp', 'calendar_event', target.id,
    'event_rsvp:' || target.id || ':' || caller || ':' || response);
end;
$$;

grant execute on function public.set_event_attendees(uuid, uuid[]) to authenticated;
grant execute on function public.rsvp_event(uuid, public.event_rsvp) to authenticated;
