-- Gentle reminders on pg_cron every 5 minutes, without a session (public.notify records no actor).
-- A reminder is retired unsent when the reader has since responded with here, talk or thanks.
-- pg_cron is first needed here (calendar reminders enable it later too); creating it is idempotent.
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.deliver_note_nudges()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare r record; n integer := 0;
begin
  for r in
    select x.id, x.space_id, x.note_id, x.user_id, x.created_at
    from public.space_note_nudges x
    where x.sent_at is null and x.remind_at <= now()
    order by x.remind_at
    limit 1000
    for update of x skip locked
  loop
    if not exists (select 1 from public.space_note_responses s where s.note_id = r.note_id
        and s.author_id = r.user_id and s.kind in ('here', 'talk', 'thanks')
        and s.created_at >= r.created_at) then
      perform public.notify(r.user_id, r.space_id, 'note_nudge', 'space_note', r.note_id,
        'note_nudge:' || r.id);
      n := n + 1;
    end if;
    update public.space_note_nudges set sent_at = now() where id = r.id;
  end loop;
  return n;
end;
$$;

revoke execute on function public.deliver_note_nudges() from public, anon, authenticated;

select cron.schedule('note-nudges', '*/5 * * * *', 'select public.deliver_note_nudges()');
