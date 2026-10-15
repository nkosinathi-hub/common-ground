# Common Ground

A private shared space for the people you watch things and dream things up with: shared
watchlists with per-person progress, ratings, comments and recommendations, plus ideas that grow
into projects with tasks, milestones and budgets.

Svelte 5 + Vite SPA (GitHub Pages) on Supabase (Postgres with row-level security, Auth, Storage,
Edge Functions, Realtime). Title data from TMDB, streaming availability from JustWatch via TMDB.

## Quick start

```sh
mise install                # node 24, pnpm 10
pnpm install
systemctl --user enable --now podman.socket   # or Docker
pnpm exec supabase start
cp .env.example .env.local  # then paste the local URL and publishable key from `supabase status`
pnpm secrets:tmdb           # writes supabase/functions/.env from your TMDB key file
pnpm dev
```

## The one command

`pnpm guard` runs everything a change must pass: format, file-length and layer rules, lint, type
check, unit tests with coverage, database tests (pgTAP), build and a bundle secret scan.
`pnpm guard:e2e` adds the Playwright suite.

## Docs

- [Conventions](docs/CONVENTIONS.md): layers, file size, tests first, database rules
- [Architecture decisions](docs/adr/)
- [Runbooks](docs/runbooks/): setup, deployment, secrets, backups, rollback
