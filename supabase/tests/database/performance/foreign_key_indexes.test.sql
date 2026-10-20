-- Every foreign key a parent delete follows has an index on exactly its columns or leading with
-- the parent's id (for (space_id, parent_id) the unique parent id alone is selective). The one exception is
-- author-style links to profiles, set null only when an account is deleted (docs/migrations.md).
begin;
select plan(1);

select is(
  (select array_agg(c.conrelid::regclass || '.' || a.attname order by 1)::text
     from pg_constraint c
     join pg_namespace n on n.oid = c.connamespace
     cross join lateral (
       select k.attnum, k.attname from pg_attribute k
        where k.attrelid = c.conrelid and k.attnum = any (c.conkey)
          and (k.attname <> 'space_id' or cardinality(c.conkey) = 1)
        order by array_position(c.conkey, k.attnum) limit 1) a
    where c.contype = 'f' and n.nspname = 'public'
      and not (c.confrelid = 'public.profiles'::regclass and c.confdeltype = 'n')
      and not exists (
        select 1 from pg_index i
         where i.indrelid = c.conrelid
           and (i.indkey[0] = a.attnum
             or (i.indkey::int2[])[0:cardinality(c.conkey) - 1] @> c.conkey
            and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] <@ c.conkey))),
  null, 'every foreign key outside author links has a leading index');

select * from finish();
rollback;
