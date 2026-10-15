-- Runs last. Postgres grants EXECUTE to PUBLIC on every new function, so anon could call RPCs.
-- Deny by default: only authenticated may call client RPCs; triggers and helpers are server-only.
-- supabase/tests/database/security/function_grants.test.sql fails if a later migration regresses.
revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public, anon;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;

revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.set_updated_at() from authenticated;
revoke execute on function public.watch_items_normalise() from authenticated;
