-- Phones that receive push notifications through FCM. A token identifies one app install, so it
-- belongs to exactly one user: registering it again from another account moves it there.
create table public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  token text not null unique check (char_length(token) between 16 and 4096),
  platform text not null check (platform in ('android')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index push_devices_user on public.push_devices (user_id, last_seen_at desc);

alter table public.push_devices enable row level security;

create policy push_devices_select_own on public.push_devices for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_devices_insert_own on public.push_devices for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy push_devices_delete_own on public.push_devices for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, delete on public.push_devices to authenticated;
grant insert (token, platform) on public.push_devices to authenticated;
-- The push Edge Function reads tokens and forgets the ones FCM reports as gone.
grant select, delete on public.push_devices to service_role;

-- Upsert for the caller. Security definer because a token may still name its previous owner,
-- whose row RLS hides. Keeps the caller's ten most recently seen devices.
create or replace function public.register_push_device(token text, platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if char_length(coalesce(register_push_device.token, '')) not between 16 and 4096 then
    raise exception 'invalid device token' using errcode = '22023';
  end if;
  insert into public.push_devices (user_id, token, platform, created_at, last_seen_at)
  values (caller, register_push_device.token, register_push_device.platform,
          clock_timestamp(), clock_timestamp())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform,
        last_seen_at = excluded.last_seen_at,
        created_at = case when push_devices.user_id = excluded.user_id
                          then push_devices.created_at else excluded.created_at end;
  delete from public.push_devices d
   where d.user_id = caller
     and d.id not in (select k.id from public.push_devices k where k.user_id = caller
                       order by k.last_seen_at desc limit 10);
end;
$$;

-- Sign-out on a phone. Invoker: RLS limits the delete to the caller's own token.
create or replace function public.unregister_push_device(token text)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.push_devices d where d.token = $1;
$$;

revoke execute on function public.register_push_device(text, text) from public, anon;
revoke execute on function public.unregister_push_device(text) from public, anon;
grant execute on function public.register_push_device(text, text) to authenticated;
grant execute on function public.unregister_push_device(text) to authenticated;
