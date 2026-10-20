-- Push delivery: every new notification queues one pg_net POST to the push Edge Function, which
-- loads it with push_targets and sends it through FCM. pg_net queues inside the transaction and
-- sends after commit, so a rolled-back notification is never pushed. The function URL and the
-- shared secret live in Vault (configure_push, run at deploy), never in this file.
create extension if not exists pg_net with schema extensions;

-- Sets the Vault entries the trigger reads. Only the database owner may call it (deploy).
create or replace function public.configure_push(function_url text, secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  setting record;
  existing uuid;
begin
  if char_length(coalesce(secret, '')) < 32 then
    raise exception 'push secret must be at least 32 characters' using errcode = '22023';
  end if;
  for setting in select * from (values ('push_function_url', function_url), ('push_secret', secret))
    as v (name, value)
  loop
    select s.id into existing from vault.secrets s where s.name = setting.name;
    if existing is null then
      perform vault.create_secret(setting.value, setting.name);
    else
      perform vault.update_secret(existing, setting.value);
    end if;
  end loop;
end;
$$;

-- Never fails the insert: a missing setting skips the call, and any error is logged and dropped.
-- Only the SQLSTATE is logged, so neither the URL nor the secret can reach the log.
create or replace function public.notifications_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target text;
  secret text;
begin
  if not exists (select 1 from public.push_devices d where d.user_id = new.recipient_id) then
    return new;
  end if;
  select s.decrypted_secret into target from vault.decrypted_secrets s
   where s.name = 'push_function_url';
  select s.decrypted_secret into secret from vault.decrypted_secrets s where s.name = 'push_secret';
  if target is null or secret is null then return new; end if;
  perform net.http_post(
    url := target,
    body := jsonb_build_object('notificationId', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    timeout_milliseconds := 5000);
  return new;
exception when others then
  raise warning 'push enqueue failed for notification % (sqlstate %)', new.id, sqlstate;
  return new;
end;
$$;

create trigger notifications_push after insert on public.notifications
  for each row execute function public.notifications_push();

-- What the push function sends: the notification, its actor's name, and one row per device.
create or replace function public.push_targets(target_notification uuid)
returns table (
  token text, space_id uuid, type text, subject_type text, subject_id uuid, actor_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select d.token, n.space_id, n.type, n.subject_type, n.subject_id, p.display_name
    from public.notifications n
    join public.push_devices d on d.user_id = n.recipient_id
    left join public.profiles p on p.id = n.actor_id
   where n.id = target_notification;
$$;

revoke execute on function public.configure_push(text, text) from public, anon, authenticated, service_role;
revoke execute on function public.notifications_push() from public, anon, authenticated;
revoke execute on function public.push_targets(uuid) from public, anon, authenticated;
grant execute on function public.push_targets(uuid) to service_role;
