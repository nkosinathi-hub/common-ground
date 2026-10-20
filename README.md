# Common Ground

A private shared space for the people you watch things and dream things up with: shared
watchlists with per-person progress, ratings, comments and recommendations, plus ideas that grow
into projects with tasks, milestones and budgets.

Svelte 5 + Vite SPA (GitHub Pages) on Supabase (Postgres with row-level security, Auth, Storage,
Edge Functions, Realtime). Title data from TMDB, streaming availability from JustWatch via TMDB.

## Quick start

Needs [mise](https://mise.jdx.dev) (or node 24 and pnpm 10) and Podman or Docker.

```sh
mise install && pnpm install
pnpm run setup   # checks tools, finds Podman/Docker, starts Supabase, migrates, seeds, fills .env
pnpm dev         # http://127.0.0.1:5173, sign in as ana@demo.local / demo-password-ana
```

`pnpm setup` is a pnpm built-in, so the script runs as `pnpm run setup`. Flags and the
per-OS engine detection are in the [setup runbook](docs/runbooks/setup.md). Title search also
needs TMDB credentials: `pnpm secrets:tmdb` ([secrets](docs/runbooks/secrets.md)).

## The one command

`pnpm guard` runs everything a change must pass: format, a dependency audit (high and above),
file-length and layer rules, lint, import cycles, dead code (knip), type check, unit tests with
coverage, the Edge Function type check (Deno, against deno.lock), database tests (pgTAP), the
Supabase advisors, build and a bundle secret scan.
`pnpm guard:e2e` adds the Playwright suite (desktop, tablet and 360px phone; axe on every route).
GitLab CI runs the same steps on every merge request.

## Docs

Start at the [documentation index](docs/00-index.md).

- [Engineering standards](docs/standards.md): tests first, 100-line files, layers, commits
- [Conventions](docs/CONVENTIONS.md): layout, layer table, database rules
- [Security](docs/security.md): threat model, RLS isolation, secrets, POPIA
- [Architecture decisions](docs/adr/0001-stack.md) (0001 to 0007)
- [Runbooks](docs/00-index.md#documentation-index): setup, secrets, SMTP, TMDB terms, quotas,
  backup, rollback

## Licence

[MIT](LICENSE)
