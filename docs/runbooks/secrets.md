# Secrets

Rule: secrets live in exactly one store per environment and never in git, the bundle or a log.
`scripts/guard/bundle-scan.ts` fails the build if `dist/` contains a service-role marker or JWT, an
`sb_secret_` key, a TMDB access token or any value from `supabase/functions/.env`.

| Secret                      | Used by                 | Local                             | Production                      |
| --------------------------- | ----------------------- | --------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`         | browser bundle (public) | `.env` from `pnpm run setup`      | GitHub repository variable      |
| `VITE_SUPABASE_ANON_KEY`    | browser bundle (public) | `.env` (publishable key)          | GitHub repository variable      |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions only     | injected by `supabase start`      | injected by Supabase            |
| `TMDB_ACCESS_TOKEN`         | catalog Edge Function   | `supabase/functions/.env`         | Supabase function secret        |
| `ALLOWED_ORIGINS`           | catalog Edge Function   | written by `pnpm secrets:tmdb`    | Supabase function secret        |
| `CLEANUP_SECRET`            | attachments cleanup     | `supabase/functions/.env`         | Supabase secret + GitLab CI var |
| `PUSH_SECRET`               | push function and Vault | not set (push stays off)          | Supabase secret + GitLab CI var |
| `FCM_SERVICE_ACCOUNT`       | push Edge Function      | not set (push stays off)          | Supabase secret + GitLab CI var |
| `SIMKL_CLIENT_ID`           | simkl function, V2 id   | not set (Simkl import stays off)  | Supabase secret + GitLab CI var |
| `PUBLIC_API_URL`            | attachments signed URLs | written by `pnpm secrets:tmdb`    | not set (hosted URL is public)  |
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
`ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `PUSH_SECRET`,
`FCM_SERVICE_ACCOUNT`, `SIMKL_CLIENT_ID`. See `.gitlab/ci/deploy.yml`; push values are
described in [push](push.md), the Simkl client id in [simkl](simkl.md).

## Staging deploy

`supabase-deploy-staging` (`.gitlab/ci/deploy.yml`) is a manual job on merge request pipelines
and on pipelines started by hand (CI/CD > Run pipeline) on the release integration branch. That
branch is matched by name, `<issue>-v<major>-<minor>` (`1-v0-1`, `2-v0-2`, ...), so a new release
needs no CI change; feature branches such as `2-v0-2-notes` do not match. To deploy another
branch, set the CI variable `STAGING_BRANCH` to its name. The workflow rules start no push
pipeline for the integration branch, and while it has an open MR its pipelines are MR pipelines. The job
pushes migrations and Edge Functions to a second Supabase project, so it needs one: Nkosi creates
the staging project (free tier) and sets three masked CI variables, not protected, because MR
branches are not protected branches: `STAGING_SUPABASE_ACCESS_TOKEN`,
`STAGING_SUPABASE_PROJECT_REF` and `STAGING_SUPABASE_DB_PASSWORD`. Until then the job prints
"Skipping staging deploy" and passes. Function secrets (`TMDB_ACCESS_TOKEN`, `ALLOWED_ORIGINS`) are
set once on the staging project with `supabase secrets set --project-ref <staging ref>`. Never
point the STAGING_ variables at the production project.

## GitHub repository variables

Settings > Secrets and variables > Actions > Variables: `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` (production project). Read by `.github/workflows/pages.yml`.

## Rotation

Rotate in the store, redeploy the consumer (re-run `supabase-deploy` or the Pages workflow), then
revoke the old value. A leaked service-role key means rotating JWT keys in the Supabase dashboard.
