# Playback languages, subtitles and shared controls

## Viewer controls

- English is preferred when a stream advertises it. Audio language choices come from the actual
  player's tracks; choosing another language saves that device's preference.
- CinePro preserves provider audio metadata and ranks advertised English ahead of unknown audio
  or a different dub within the same provider priority. “Original” is unknown, not English.
- Open Playback options, then Playback source, to change providers without losing the current position. A provider cannot
  supply an audio language it does not carry.
- Open Audio and subtitles to choose tracks or load a file. Load subtitle file accepts SRT or VTT up to 2 MB. SRT is converted to WebVTT in memory. The file
  stays on the viewer's device; it is not stored in the workspace or sent to the playback API.
  Selecting identical contents again adds no duplicate track. It follows source fallback inside
  the current player, and is released when the player closes.
- Source failure preserves position while trying fallbacks, then renews cached links once without
  progress. Another recovery budget requires a minute of successful progression. Closing aborts it.
- Account and data > Profile and sign-in > Playback contains Jellyfin access and automatic intro /
  next episode preferences. Known intros skip after three seconds; the next episode counts down
  for ten seconds at credits/end. Manual Next episode remains available. Unknown intros are not guessed.
- The demo plays a labelled synthetic preview through the production player; it is not a provider test.
- `E2E_PUBLIC_PLAYBACK_IP=<public-DNS-IP> VITE_CINEPRO_CORE_ORIGIN=<origin>` opts into
  `public-continuity.spec.ts`. It pins browser DNS to a public Funnel address and asserts the remote
  address while playing an older film, newer film and episode past 100 seconds. Use a local test
  Supabase stack, never production credentials. Physical mobile browser testing is still separate.

## API runtime rollout

On the Core host, after checking out the updated revision:

```sh
scripts/cinepro/server.sh install funnel
```

This updates the existing user service and restarts it. The script hashes the mounted runtime
and proxy patches into the container configuration: changed code recreates the service, while
repeating the same command keeps one service and the same Funnel route. Boot startup remains
managed by the existing systemd service. No schema migration or account changes are needed.
The website and APK changes ship through the normal merge/deploy workflows.

The preload is installed once per process and retains the framework's URL validation, proxy,
metadata and response cache. It bounds the provider aggregation at 12 seconds, with a short
collection window after English results; metadata and proxy delivery have their own network
latency. Frontend resolution collects fast playable results without waiting for every provider.

## Regression coverage

- Node runtime tests cover provider deadlines, cancellation, and repeated installation; shell
  command stubs cover repeated service install/start without modifying a real daemon or route.
- Browser tests use a seekable fixture server and two separate accounts/contexts on local
  Supabase Realtime. Both MP4 and HLS exercise native start, pause, forward/reverse seeks,
  participant controls, shared progression and watch history for both members. Ten consecutive
  two-browser party runs (five per format) also cover rapid seek/buffering bursts without
  exceeding Realtime presence limits. Membership uses one presence track per join; fast player
  state travels on private broadcasts, with duplicate suppression and buffering coalescing.
- A multi-audio HLS fixture declares Spanish as its default; the player selects English and can
  switch to Spanish. MP4 and HLS load local SRT captions, show cues and deduplicate re-selection.
- These deterministic browser checks do not certify a third-party provider's availability or
  physical iPhone/Android behavior. The existing public smoke workflow runs outside the tailnet.
