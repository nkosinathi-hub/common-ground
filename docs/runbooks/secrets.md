# Secrets

Rule: secrets live in exactly one store per environment and never in git, the bundle or a log.
`scripts/guard/bundle-scan.ts` fails the build if `dist/` contains a service-role marker, an
`sb_secret_` key or any value from `supabase/functions/.env`.

| Secret                      | Used by                 | Local                             | Production                      |
| --------------------------- | ----------------------- | --------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`         | browser bundle (public) | `.env` from `pnpm run setup`      | GitHub repository variable      |
| `VITE_SUPABASE_ANON_KEY`    | browser bundle (public) | `.env` (publishable key)          | GitHub repository variable      |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only     | injected by `supabase start`      | injected by Supabase            |
| `TMDB_ACCESS_TOKEN`         | catalog Edge Function   | `supabase/functions/.env`         | Supabase function secret        |
| `ALLOWED_ORIGINS`           | catalog Edge Function   | written by `pnpm secrets:tmdb`    | Supabase function secret        |
| `CLEANUP_SECRET`            | attachments cleanup     | `supabase/functions/.env`         | Supabase secret + GitLab CI var |
| SMTP user and password      | Supabase Auth emails    | not needed (Mailpit catches mail) | Supabase dashboard, Auth > SMTP |
| `SUPABASE_ACCESS_TOKEN`     | `supabase-deploy` job   | not needed                        | GitLab CI variable, masked      |
| `SUPABASE_DB_PASSWORD`      | `supabase-deploy` job   | not needed                        | GitLab CI variable, masked      |
| GitHub fine-grained token   | GitLab push mirror      | not needed                        | GitLab mirror settings          |

The publishable (anon) key is public by design: RLS is what protects data (ADR 0003).

## TMDB

The token file stays outside the repository (default `~/Downloads/tmdb keys`, override with
`TMDB_KEYS_FILE`). `pnpm secrets:tmdb` writes it to `supabase/functions/.env`;
`pnpm secrets:tmdb --remote` also runs `supabase secrets set` for the linked project. The script
prints key names only, never values.

## GitLab CI variables

Set under Settings > CI/CD > Variables, masked and protected (main only): `SUPABASE_ACCESS_TOKEN`,
`SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `TMDB_ACCESS_TOKEN`, `CLEANUP_SECRET`,
`ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. See `.gitlab/ci/deploy.yml`.

## GitHub repository variables

Settings > Secrets and variables > Actions > Variables: `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (production project). Read by `.github/workflows/pages.yml`.

## Rotation

Rotate in the store, redeploy the consumer (re-run `supabase-deploy` or the Pages workflow), then
revoke the old value. A leaked service-role key means rotating JWT keys in the Supabase dashboard.
