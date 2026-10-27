# CinePro Core: an optional playback backend

Common Ground can play from a self-hosted [CinePro Core](https://github.com/cinepro-org/core)
through the `cinepro` playback adapter (`docs/playback-plugins.md`). Core is a separate service
under the PolyForm Noncommercial licence; this repository vendors none of it. The adapter calls
its OMSS routes for a TMDB movie id, or a series id with season and episode, and keeps only the
sources and subtitles that resolve to the Core origin itself: the browser never receives a
third-party origin from an answer. That origin is fixed at build time and written into the CSP.
Without `VITE_CINEPRO_CORE_ORIGIN` no CinePro provider is built; with it, CinePro ranks first.

Core is a scraper of third-party streaming sites. The person running it is responsible for what
it reaches and for the laws and terms that apply. It has no authentication of its own. Keep it on
loopback or the tailnet unless you intentionally choose the public Funnel deployment below.

## Run it locally

1. Create a TMDB API key (v3) at <https://www.themoviedb.org/settings/api>.
2. Copy `cinepro/.env.example` to `cinepro/.env` (gitignored) and set `TMDB_API_KEY`.
3. Start Core: `podman compose -f cinepro/compose.yml up -d` (or `docker compose`). The image is
   pinned by tag and digest in `cinepro/compose.yml`. It binds 127.0.0.1:3000 only.
4. Check <http://127.0.0.1:3000/>: JSON with `"status": "operational"` and the endpoints.
5. Put the origin in `.env.development.local` (gitignored), not in `.env.local`:

   ```dotenv
   VITE_CINEPRO_CORE_ORIGIN=http://127.0.0.1:3000
   ```

   `pnpm dev` alone may name a loopback http Core. `pnpm build`, and so `pnpm guard` and the
   Playwright build, run in production mode, load `.env.local` too, and refuse http by design,
   exactly as they refuse an http Jellyfin.

6. Restart Vite: the variable is compiled in, not read at runtime. Open a film or an episode and
   press Play. The resolver's timeout (20 s), source validation, health and fallback apply.

`PUBLIC_URL` in the compose file must be the origin the app calls: Core builds the proxy links in
its answers from it, and the adapter drops a link on any other origin. The default matches step 5.

Core answers only when its slowest provider has, and Videasy waits 60 to 100 s on a hanging
upstream while the rest answer within 3 s, so `compose.yml` mounts `cinepro/no-provider.js` over
its module: Core registers only exported classes and skips an empty one. Switch another
provider off the same way when `podman logs common-ground-cinepro-core` shows it stalling.

Core's proxy also rewrites every answer the upstream labels as text, to fix up playlists, and
that destroys media a host disguises as `.html`: the bytes come back as UTF-8 replacement
characters under the original length. `cinepro/stream-patterns.js`, mounted over Core's own
list, routes such hosts through the proxy's byte-safe streaming path instead; add a pattern there
when a provider's segments arrive corrupted. The player, for its part, takes a segment served
with a non-media type for a transport stream (`segmentContentType` in the playback UI).

## Publish it for all Common Ground users

The deployed site and the Android app are HTTPS origins, so they need an HTTPS Core that every
phone and browser can reach. Workspace members do not need to join your tailnet. Publish Core
with Tailscale Funnel on the next port:

1. On the Core host, run `scripts/cinepro/server.sh install funnel`. It runs Core from the compose
   file and publishes it at `https://<host>.ts.net:8443` through Tailscale Funnel, then installs a
   systemd user service to repeat this at boot. It sets `PUBLIC_URL` to that origin and
   `CORS_ORIGIN` to `*`: the site (`https://<owner>.github.io`) and the app (`https://localhost`
   inside the WebView) are two origins and Core's CORS setting takes one. The command enables
   lingering for your user so the service starts before you log in after a reboot.
2. Funnel makes Core reachable from the public internet. Core has no authentication, so anyone
   can call its source-discovery and proxy routes. Do not use this deployment for private media
   or expose Jellyfin through the same Funnel. To keep Core private, use
   `scripts/cinepro/server.sh start serve`; every viewer then needs to be on your tailnet.
3. Set the GitHub repository variable `VITE_CINEPRO_CORE_ORIGIN` to that origin (Settings,
   Secrets and variables, Actions, Variables, or `gh variable set`). The Pages and APK workflows
   pass it to the build.
4. Bump the version in `package.json` and merge: the site redeploys and the APK's update check
   offers the new build. Viewers do not need Tailscale installed.
5. On the machine that runs Core, point `pnpm dev` at the published origin too (an https origin
   is allowed in every mode): the local container and the published one share a name and a port.

The app still requires sign-in and space membership to open a title. Those checks protect the
workspace data; they do not authenticate requests made directly to the public CinePro endpoint.

`scripts/cinepro/server.sh stop` disables the installed user service, removes the Tailscale route,
and stops the container. `scripts/cinepro/server.sh install serve` installs the same boot startup
using tailnet-only Tailscale Serve instead of public Funnel. To start it only for the current
session, use `scripts/cinepro/server.sh start funnel`.

## Troubleshooting

- **CinePro is not listed as a provider:** check `VITE_CINEPRO_CORE_ORIGIN` in the right env
  file and restart Vite or rebuild.
- **Browser CORS error:** locally, open the app at `http://127.0.0.1:5173`, the origin in
  `cinepro/compose.yml`, or set `CINEPRO_CORS_ORIGIN` in `cinepro/.env` and recreate.
- **No playable sources:** `podman compose -f cinepro/compose.yml logs -f cinepro-core`; check
  the TMDB id, and that `PUBLIC_URL` is the origin the app calls.
- **The live test:** `E2E_LIVE=1 VITE_CINEPRO_CORE_ORIGIN=<origin> pnpm exec playwright test
tests/e2e/watch/cinepro-playback.spec.ts --project desktop` plays a film through the real
  Core and checks what the player fetched from it.

## API routes used

- `GET /` for health and endpoint discovery.
- `GET /v1/movies/{tmdbId}` for movies.
- `GET /v1/tv/{tmdbId}/seasons/{season}/episodes/{episode}` for episodes.

Reference: the [OMSS specification](https://github.com/omss-spec/omss-spec) v1.1 and
<https://docs.cinepro.cc>.
