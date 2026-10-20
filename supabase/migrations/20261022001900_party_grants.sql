-- Runs last for the parties range. Supabase's default privileges still give anon EXECUTE on new
-- functions, so the party RPCs are revoked from anon again; authenticated keeps the grants each
-- file made (supabase/tests/database/security/function_grants.test.sql holds the allow-list).
revoke execute on function public.start_party(uuid, text, integer, integer, integer, integer,
  integer[]) from public, anon;
revoke execute on function public.join_party(uuid) from public, anon;
revoke execute on function public.confirm_party(uuid) from public, anon;
revoke execute on function public.cancel_party(uuid) from public, anon;
revoke execute on function public.handover_party(uuid) from public, anon;
revoke execute on function public.finish_party(uuid) from public, anon;
