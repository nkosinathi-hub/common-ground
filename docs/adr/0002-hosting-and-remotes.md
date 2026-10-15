# 0002. Hash-routed SPA on GitHub Pages; GitLab primary, GitHub mirror

- Status: accepted
- Date: 2026-10-15

## Context

The app is static (ADR 0001). GitHub Pages hosts static sites for free, but the project's issues,
merge requests and CI live on GitLab. Pages has no server-side rewrites, so deep links to
history-API routes would 404.

## Decision

- GitLab (`gitlab.com/nkosinathi1/common-ground`, private) is the primary forge: issues, MRs,
  CI (`.gitlab-ci.yml`).
- `main` is push-mirrored to the public GitHub repository `common-ground`, whose
  `.github/workflows/pages.yml` builds with `PAGES_BASE_PATH=/common-ground/` and deploys Pages.
- Routes live in the URL hash (`#/s/<space>/watch`). Supabase auth redirects arrive as
  `?code=` before the hash; a dedicated callback exchanges the code before the router starts,
  then scrubs the query string.
- Public client values (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are GitHub repository
  variables. No secret is ever needed at build time.

## Consequences

- Any URL works on refresh without server rewrites.
- Deploys happen only when `main` changes on GitLab and the mirror pushes. The mirror needs a
  GitHub fine-grained token held in GitLab.
- The GitHub repository is public, so the bundle must never contain a secret (guard bundle scan).
