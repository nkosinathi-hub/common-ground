# Setup

One command on Linux, macOS and Windows, then the dev server.

```sh
mise install        # node 24 and pnpm 10, pinned in .mise.toml
pnpm install
pnpm run setup      # `pnpm setup` is a pnpm built-in, so `run` is required
pnpm dev            # http://127.0.0.1:5173
```

## What `pnpm run setup` does

Source: `scripts/setup/index.ts`. Safe to run again at any time.

1. Checks node and pnpm against `.mise.toml`; stops with `run: mise install` when they differ.
2. Finds a container engine and exports `DOCKER_HOST` for the Supabase CLI. `DOCKER_HOST` in
   your environment always wins. Otherwise, in order:
   - Linux: rootless Podman `$XDG_RUNTIME_DIR/podman/podman.sock`, then `/var/run/docker.sock`,
     then Docker Desktop `~/.docker/desktop/docker.sock`
   - macOS: Podman machine sockets under `~/.local/share/containers/podman/machine/`, Docker
     Desktop `~/.docker/run/docker.sock`, Colima, then `/var/run/docker.sock`
   - Windows: named pipes `podman-machine-default`, then `docker_engine`
3. Starts local Supabase if it is not running, without the heavy services
   (`studio,imgproxy,vector,logflare`). Flags:
   - `--no-functions` also skips the Edge Functions runtime (catalog search then fails)
   - `--full` starts everything, including Studio
   - `--skip-stack` only checks tools and `.env`
4. Applies pending migrations (`supabase migration up --local`) and the idempotent demo seed
   (`supabase/seed.sql`).
5. Adds keys missing from `.env` using `.env.example`. Existing lines are never rewritten. Keys it
   adds for the Supabase client take the running stack's URL and publishable key.

`pnpm guard` uses the same engine detection (`scripts/guard/index.ts`).

## Engine first-time setup

- Fedora/Linux: `systemctl --user enable --now podman.socket`
- macOS: `brew install podman && podman machine init && podman machine start`, or Docker Desktop
- Windows: Podman Desktop or Docker Desktop with the WSL 2 backend

## Demo accounts (local only)

`ana@demo.local` / `demo-password-ana` and `ben@demo.local` / `demo-password-ben` share the space
"Ana and Ben". These passwords are public; the seed must never run against a hosted project.

## Catalog search locally

TMDB credentials go into `supabase/functions/.env` with `pnpm secrets:tmdb` (see
[secrets](secrets.md)). Without them the app works, but title search returns an error.

## Troubleshooting

- `No container engine found`: start the engine, or export `DOCKER_HOST`.
- Port 54321 in use: another Supabase project is running; `pnpm exec supabase stop` there.
- Stale `.env` values (wrong key after a reset): delete the two `VITE_SUPABASE_*` lines and run
  setup again.
