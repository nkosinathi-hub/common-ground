# Jellyfin for in-app playback

Common Ground plays films and shows you own from your own Jellyfin server (the `jellyfin`
playback adapter, `docs/playback-plugins.md`). Nothing is uploaded anywhere: each phone or
browser streams straight from the server with its own Jellyfin login.

## Start the server

- `scripts/jellyfin/server.sh start <media folder> serve` runs Jellyfin 12.2 in rootless
  podman, bound to 127.0.0.1:8096, with the media folder read-only, and publishes it over
  HTTPS with `tailscale serve`. Only devices on your tailnet can reach it.
- Use `funnel` instead of `serve` only if her phone will not run Tailscale: the server is then
  on the public internet. Read the hardening list below first.
- `scripts/jellyfin/server.sh stop` removes the container and the Tailscale route. Config and
  the library database stay in `~/.local/share/common-ground-jellyfin`.
- The website and the app are HTTPS origins, so the server must be HTTPS: Tailscale issues
  the `*.ts.net` certificate. Build the app with `VITE_JELLYFIN_ORIGIN=https://<host>.ts.net`.

## First setup (in the Jellyfin web page)

1. Create the administrator account, then a separate everyday account for each of you.
   Neither everyday account is an administrator.
2. Add libraries for Films and Shows. Keep TMDB metadata on, so Common Ground can match titles
   and episodes by their TMDB ids.
3. Install the Intro Skipper plugin from its repository (Dashboard, Plugins, Repositories),
   version 12.0.5.0 or later for Jellyfin 12. It marks intros, recaps and credits, which the
   app shows as Skip buttons.
4. Enable Quick Connect (Dashboard, General). Common Ground signs in with a short code.

## Hardening (required with funnel)

- Run 12.2 or later: CVE-2026-35033 (unauthenticated file read through stream options) is
  fixed from 10.11.7, and 12.x also dropped the legacy `api_key` routes.
- Set "Login attempts before lockout" (Dashboard, Users, each user) to a small number, and give
  every account a long, unique password.
- Jellyfin 12.2 serves `/Videos/{id}/stream` without a token (found by the live test,
  `jellyfin.live.test.ts`); only the API that lists item ids needs one. Behind `serve` only your
  tailnet can reach it; behind `funnel` anyone holding an item id could stream that file, so
  prefer `serve` and Tailscale on her phone.
- Do not ban by IP: behind Funnel every request arrives from the local Tailscale proxy, so an
  IP ban locks out both of you.
- Leave remote access settings as they are: Jellyfin listens only on 127.0.0.1 and Tailscale
  is the only way in. Keep the image updated (`podman pull`, then stop and start).

## Live test

`JELLYFIN_LIVE_URL=<server> JELLYFIN_LIVE_USER=<everyday user> JELLYFIN_LIVE_PASSWORD_FILE=<file>
JELLYFIN_LIVE_TMDB=<a film's TMDB id> pnpm exec vitest run jellyfin.live` signs in, resolves the
film, streams it with the token in a header, reports progress and checks the resume point, then
signs out. It is skipped without `JELLYFIN_LIVE_URL`.

## Signing in from Common Ground

- Account, Sources, Connect Jellyfin: the app shows a Quick Connect code; approve it in
  Jellyfin (your user menu, Quick Connect). The token stays on that device only, never in
  Supabase, and signing out of Common Ground signs that device out of Jellyfin too.
