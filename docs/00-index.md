# Documentation index

1. [README](../README.md): what Common Ground is and the quick start
2. [Engineering standards](standards.md): tests first, 100-line files, layers, commits
3. [Conventions](CONVENTIONS.md): layout, layer table, database rules; [UI patterns](ui-patterns.md):
   lists, reloads, contexts, stores, navigation and naming people; [Migrations](migrations.md):
   redefined functions, grants and cleanup slots
4. [Security](security.md): threat model, RLS isolation, secrets, POPIA
5. Architecture decisions (`adr/`)
   1. [0001 Svelte 5 SPA on Supabase; Figma export as reference](adr/0001-stack.md)
   2. [0002 Hash-routed SPA on GitHub Pages; GitLab primary, GitHub mirror](adr/0002-hosting-and-remotes.md)
   3. [0003 RLS for all access; security-definer RPCs for multi-row changes](adr/0003-rls-and-rpcs.md)
   4. [0004 Integer minor-unit money; date-only dates](adr/0004-money-and-dates.md)
   5. [0005 Keyset pagination on (created_at, id), 50 per page](adr/0005-keyset-pagination.md)
   6. [0006 updated_at conflict detection with a merge prompt](adr/0006-conflict-detection.md)
   7. [0007 One branch and one MR for v0.1](adr/0007-one-mr-for-v0-1.md)
   8. [0008 Calendar time model: instants, dates and window paging](adr/0008-calendar-time-model.md)
6. Runbooks (`runbooks/`)
   1. [Setup](runbooks/setup.md): `pnpm run setup`, engines, demo accounts
   2. [Secrets](runbooks/secrets.md): where each secret lives and how to rotate it
   3. [SMTP](runbooks/smtp.md): Resend for production auth email, Mailpit locally
   4. [TMDB terms](runbooks/tmdb-terms.md): attribution and caching rules
   5. [Quotas](runbooks/quotas.md): Supabase free tier limits and keep-alive
   6. [Backup](runbooks/backup.md): database dump, restore drill, member export
   7. [Rollback](runbooks/rollback.md): Pages, migrations, functions

## CI and deployment

- GitLab CI: `.gitlab-ci.yml` with `.gitlab/ci/{verify,database,deploy}.yml`. Jobs mirror
  `pnpm guard`; `e2e` is manual; `supabase-deploy` is manual on `main`; `keep-alive` runs on a
  daily schedule.
- GitHub Pages: `.github/workflows/pages.yml` on push to `main` of the GitHub mirror.
