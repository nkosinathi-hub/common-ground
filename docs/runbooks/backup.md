# Backup

The free tier has no point-in-time recovery and no downloadable backups, so we take our own.

## Weekly database dump (maintainer)

Requires the Supabase CLI, the project ref and the database password (from the password manager,
never from a file in the repository).

```sh
export SUPABASE_DB_PASSWORD=...           # from the password manager
pnpm exec supabase link --project-ref <ref>
stamp=$(date +%F)
pnpm exec supabase db dump --linked -f "backup-$stamp-roles.sql" --role-only
pnpm exec supabase db dump --linked -f "backup-$stamp-schema.sql"
pnpm exec supabase db dump --linked -f "backup-$stamp-data.sql" --use-copy --data-only
```

Store the three files encrypted outside the repository (for example an encrypted volume synced to
a second machine). Keep eight weekly copies. Never commit them: they contain personal data.

Storage objects (attachments) are not in the dump. Download the attachments bucket from the
Supabase dashboard (Storage), or with the CLI's `supabase storage cp` (see
`pnpm exec supabase storage --help`; it may need `--experimental`).

## Restore drill (quarterly)

1. `pnpm exec supabase start` on a clean machine (local only).
2. `psql "$LOCAL_DB_URL" -f backup-<date>-roles.sql -f backup-<date>-schema.sql`
   then `-f backup-<date>-data.sql` with `session_replication_role = replica`.
3. Sign in as a known member and check spaces, watchlists and ideas are present.

## Member export (self-service)

Every member can download a JSON export of a space (all content plus attachment references) and
of their own personal data from the account page. This is the members' own backup and POPIA
access right; it does not replace the database dump. Shipped in v0.1.
