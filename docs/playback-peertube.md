# PeerTube adapter

`src/features/playback/infrastructure/peertube/` plays openly licensed films and episodes from one
PeerTube instance. The build ships it pointed at the Blender Foundation's own instance,
`https://video.blender.org`, with four Blender open movies. It needs no account and no secret.

## What it plays, and why that is lawful

Only videos that are public, published, not live, and openly licensed. A video passes the licence
rule when either:

- its PeerTube licence field is one of ids 1 to 7 (the six Creative Commons licences and CC0), or
- its curated title carries `licence`, a `https://creativecommons.org/...` URL recording the
  licence the publisher states for the work. Use this only with a source for the claim.

The Blender films are Creative Commons Attribution. Each film's own credits carry the attribution,
and the app plays them unaltered.

## Configuration

Two parts, both fixed at build time:

1. **The instance** (`blender.ts`, `BLENDER_INSTANCE`): the origin, and optional extra `media`
   origins if the instance serves files from a CDN. The plugin's security policy is built from
   these, and so is the CSP. Changing them means a new build.
2. **The titles** (`BLENDER_TITLES`): the provider config's `options`, checked by
   `validatePeerTubeOptions` before the provider is built.

| Field           | Rule                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `tmdbId`        | The TMDB movie id, or the TMDB series id for an episode                  |
| `season`        | Episodes only; from 1 (season 0 specials are never played)               |
| `episode`       | Episodes only; from 1, and required with `season`                        |
| `episodeTmdbId` | Optional; TMDB's own episode id, matched before season and number        |
| `video`         | The PeerTube video uuid, or its short uuid                               |
| `licence`       | Optional; a creativecommons.org licence or public-domain URL (see above) |

A bad entry refuses the whole provider at start-up, with a message such as
`titles[2]: video must be a PeerTube uuid or short uuid`; `composePlayback` reports it in
`refused`, and the other providers still work.

The default provider config in `src/app/composition/playback.ts` is id `blender`, type
`peertube`, priority 3 (after Jellyfin and the Internet Archive), 6 s timeout, 1 retry.

### Adding a title

1. Find the video on the instance and read `GET /api/v1/videos/<uuid>`: it must be public
   (`privacy.id` 1), published (`state.id` 1), and `licence.id` 1 to 7, or else you need the
   publisher's licence statement for `licence`.
2. Find the TMDB id on themoviedb.org (`/movie/<id>` or `/tv/<id>`).
3. Add the entry to `BLENDER_TITLES`, run `pnpm vitest run src/features/playback`, then the live
   checks below.

## Sources it returns

In this order, before the core ranks them: the HLS master playlist when the instance has one
(ranked at its tallest rendition), the MP4 files from tallest to shortest up to 1080p (taller
single-bitrate files stall on phones), then the instance's embed player. Captions come from
`/api/v1/videos/<id>/captions` as WebVTT tracks; a caption error never stops the video.

Errors use the core's `defaultClassify`: 5xx and network failures are retried, a 404 or a refused
licence is permanent, and repeated failures open the circuit for 60 s.

## Live checks

- `E2E_LIVE=1 pnpm exec playwright test tests/e2e/watch/open-movie-playback.spec.ts`: signs in,
  adds Big Buck Bunny, plays it in the app's player, and checks it plays from
  `video.blender.org` with no CSP violation. It needs the local stack and the internet.
- Android: install a debug APK built against the local stack (as `pnpm android:smoke` does), then
  drive its WebView with Playwright's `_android.devices()` and `device.webView({ pkg })`; a plain
  `connectOverCDP` is refused by Android WebView. Press `k` in the player and read `currentTime`.
