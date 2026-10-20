-- The app talks to PostgREST only. With pg_graphql dropped (20261020000100) the platform's
-- graphql_public.graphql() is a stub that answers every query with "not enabled".
begin;
select plan(2);

select is(
  (select count(*)::int from pg_extension where extname = 'pg_graphql'),
  0, 'pg_graphql is not installed');

set local role anon;
select matches(
  graphql_public.graphql(query => '{ __typename }')::text,
  'pg_graphql extension is not enabled', 'the GraphQL endpoint serves nothing');
reset role;

select * from finish();
rollback;
