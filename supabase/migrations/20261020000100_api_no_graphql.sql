-- The app uses PostgREST only. Hosted projects ship pg_graphql enabled, which serves a second API
-- over the same tables. Without it, the platform-owned graphql_public.graphql() only answers
-- "not enabled" (its grants belong to supabase_admin and stay as they are).
drop extension if exists pg_graphql;
