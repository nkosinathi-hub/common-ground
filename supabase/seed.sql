-- Local demo data. Applied by `supabase start` / `db reset` and by `pnpm run setup`; idempotent.
-- LOCAL ONLY: these passwords are public. Never run this file against staging or production.
--   ana@demo.local / demo-password-ana    ben@demo.local / demo-password-ben
do $$
declare
  demo record;
begin
  for demo in
    select * from (values
      ('00000000-0000-4000-a000-00000000a001'::uuid, 'ana@demo.local', 'demo-password-ana', 'Ana'),
      ('00000000-0000-4000-a000-00000000b002'::uuid, 'ben@demo.local', 'demo-password-ben', 'Ben')
    ) as v (id, email, password, display_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', demo.id, 'authenticated', 'authenticated',
      demo.email, extensions.crypt(demo.password, extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('display_name', demo.display_name), now(), now(), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      demo.id, demo.id, demo.id::text, 'email',
      jsonb_build_object('sub', demo.id::text, 'email', demo.email, 'email_verified', true),
      now(), now(), now()
    ) on conflict do nothing;
  end loop;
end;
$$;

insert into public.spaces (id, name, template, created_by)
values ('00000000-0000-4000-a000-0000000c0001', 'Ana and Ben', 'couple',
  '00000000-0000-4000-a000-00000000a001')
on conflict (id) do nothing;

insert into public.space_members (space_id, user_id, role) values
  ('00000000-0000-4000-a000-0000000c0001', '00000000-0000-4000-a000-00000000a001', 'owner'),
  ('00000000-0000-4000-a000-0000000c0001', '00000000-0000-4000-a000-00000000b002', 'member')
on conflict (space_id, user_id) do nothing;

-- Ideas arrive in a later migration range; seed them only when the table exists.
do $$
begin
  if to_regclass('public.ideas') is null then
    return;
  end if;
  execute $sql$
    insert into public.ideas (id, space_id, title, stage, tags, created_by) values
      ('00000000-0000-4000-a000-0000000d0001', '00000000-0000-4000-a000-0000000c0001',
        'Weekend coffee cart', 'exploring', '{food,weekend}',
        '00000000-0000-4000-a000-00000000a001'),
      ('00000000-0000-4000-a000-0000000d0002', '00000000-0000-4000-a000-0000000c0001',
        'Photo book of our trips', 'inbox', '{gift}', '00000000-0000-4000-a000-00000000b002'),
      ('00000000-0000-4000-a000-0000000d0003', '00000000-0000-4000-a000-0000000c0001',
        'Balcony herb garden', 'planning', '{home}', '00000000-0000-4000-a000-00000000a001')
    on conflict (id) do nothing
  $sql$;
end;
$$;
