# Playback plugins

Playback (`src/features/playback/`) finds something to play for a watch-list title by asking
every configured provider at once, then ranks what comes back. The core (registry, resolver,
ranking, retries, circuit breaker, fallback) knows only the `Provider` interface and each
plugin's declared capabilities, never a plugin's name.

## The interface (`domain/plugin.types.ts`)

An adapter module exports one `ProviderPlugin`:

| Field             | What it is                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| `type`            | Unique name, used by `ProviderConfig.type`                                |
| `validateOptions` | Raw config options to typed options, or a validation error with a message |
| `capabilities`    | `media` (movie, episode), `sources` (hls, dash, file, embed), whether it  |
|                   | needs `credentials`, and whether it has a `health` probe                  |
| `security`        | Origins per directive: `connect`, `media`, `frames`, `subtitles`; and the |
|                   | iframe `sandbox` tokens its embeds need                                   |
| `create`          | `(options, deps) => Provider`; deps are fetch, clock, log, credential     |
|                   | store and the shared TMDB lookup                                          |
| `classifyError`   | `transient` (retried with backoff), `permanent`, or `auth`                |
| `detectFormat`    | Optional; defaults to the core's detector (m3u8, mpd, mp4/webm, type)     |

A `Provider` has `id`, `supports(ref)`, `resolve(ref, signal, prefs)` answering
`Result<PlayableSource[]>`, `health(signal)`, and optionally `report(event)` for providers that
keep their own resume point. A `PlayableSource` carries its kind, URL, quality, WebVTT
subtitles, skip segments (intro, credits, recap, preview), headers for its own origin, and a
resume position. Changing an audio or subtitle track is a new `resolve` with new `prefs`.

## Security policy rules (`domain/origin-policy.ts`, `domain/policy.ts`)

- Every origin is `https://host[:port]`, or `https://*.domain.tld` matching exactly one label.
- Refused: a bare `*`, `http:`, any CSP keyword, any path, and every script-capable scheme
  (`javascript:`, `data:`, `blob:`, `filesystem:`).
- Sandbox tokens: only `allow-scripts`, `allow-same-origin`, `allow-presentation` and
  `allow-popups`. Never top navigation, never escaping the sandbox.
- `PluginRegistry.register` refuses a plugin whose policy breaks a rule.
- Every source is checked against the policy of the provider that returned it
  (`validateSource`): embeds against its `frames`, everything else against its `media`,
  subtitles against its `subtitles` or `media`. A URL carrying a token (`api_key`, `ApiKey`)
  is refused. A refused source is logged and dropped; the next provider's sources still play.
- Tokens travel only in headers. The player sends them through a shaka-player request filter,
  and only to the source's own origin.

## The CSP rule

The Content Security Policy is built at build time (`scripts/vite/csp.ts`) from the plugins
listed in `src/app/composition/playback.ts`. Nothing widens it at runtime.

- `connect-src` gains every plugin's `connect`, `media` and `subtitles` origins (shaka-player
  fetches segments and text tracks), `media-src` gains `media` and `subtitles` plus `blob:`
  (Media Source Extensions), `frame-src` gains `frames` and is `'none'` without them.
- `script-src` stays `'self'`, and no other directive changes.
- `scripts/vite/playback-csp.test.ts` fails the build on a plugin declaring `*`, http or a
  scripting origin, and checks that the plugin list's imports load inside `vite.config.ts`.

**User-configured servers.** Jellyfin is the household's own server, so its origin is a
build variable: `VITE_JELLYFIN_ORIGIN=https://jellyfin.example.ts.net`. The Jellyfin plugin's
policy is exactly that one origin, the same rules validate it (http fails the build), and its
options must name the same server. A different server means a new build, never a runtime
change. Without the variable, Jellyfin is not in the build.

## Adding an adapter

1. Write one file, `infrastructure/<name>/plugin.ts`, exporting a `ProviderPlugin` (or a
   function returning one). Use relative imports only: `vite.config.ts` loads it.
2. Add one line to `playbackPlugins()` in `src/app/composition/playback.ts`, and its default
   config entry (priority, timeout, retries) beside it.
3. Test it against the local fixture server (`testing/fixture-server.ts`), as the shipped
   adapters do. Nothing in the core changes.

People can turn a provider off or reorder providers on their device; storage can never add a
provider or change its options (`application/stored-configs.ts`).

## Shipped adapters

- **jellyfin**: TMDB id to item through `ProviderIds.Tmdb`; episodes by the episode's own TMDB
  id first, then season and number (a multi-episode file reports its range). PlaybackInfo with
  an honest DeviceProfile; direct play (`stream?static=true`) or HLS; Media Segments for skip
  buttons; progress to `/Sessions/Playing*`. The per-user token stays on the device, and
  sign-out revokes the session (`POST /Sessions/Logout`) before forgetting it.
- **internet-archive**: films only, TMDB to IMDb to Wikidata (P345 to P724), accepted only with
  an explicit public-domain or Creative Commons licence; an MP4 file, then the archive embed.
- **youtube-trailer**: official TMDB trailers as `youtube-nocookie.com` embeds.
- **fixture** (tests only, never in a build): the committed samples in `tests/fixtures/playback`
  (`scripts/playback/fixtures.sh` regenerates them).

## Player (`ui/`)

shaka-player (pinned, Apache-2.0, its own lazy chunk) plays HLS, DASH and any file that needs
headers; a plain `<video playsinline>` plays other files; embeds use the sandboxed iframe
(`referrerpolicy="no-referrer"`). A playback error moves to the next ranked source. Skip
buttons come from segments, the play-next countdown from `PlaybackPorts.nextUp`, and 90
percent played calls `markWatched`. Keys: space or k, j, l, f, c, m. Theatre mode keeps the
overlays visible where native fullscreen (iOS) would hide them; play starts from the player's
own controls, a user gesture.

Only lawful sources are built: the household's own media, public-domain and openly licensed
films, and official trailers. Aggregators of unlicensed streams are out of scope for good.
