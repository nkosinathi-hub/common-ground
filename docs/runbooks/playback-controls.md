# Playback languages, subtitles and shared controls

## Viewer controls

- English is preferred when a stream advertises it. Audio language choices come from the actual
  player's tracks; choosing another language saves that device's preference.
- CinePro preserves provider audio metadata and ranks advertised English ahead of unknown audio
  or a different dub within the same provider priority. “Original” is unknown, not English.
- Use Playback source to change providers without losing the current position. A provider cannot
  supply an audio language it does not carry.
- Load subtitle file accepts SRT or VTT up to 2 MB. SRT is converted to WebVTT in memory. The file
  stays on the viewer's device; it is not stored in the workspace or sent to the playback API.
  Selecting identical contents again adds no duplicate track. It follows source fallback inside
  the current player, and is released when the player closes.
- Source exhaustion offers Retry playback, which resolves the title/episode again.

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
  participant controls, shared progression and watch history for both members.
- A multi-audio HLS fixture declares Spanish as its default; the player selects English and can
  switch to Spanish. MP4 and HLS load local SRT captions, show cues and deduplicate re-selection.
- These deterministic browser checks do not certify a third-party provider's availability or
  physical iPhone/Android behavior. The existing public smoke workflow runs outside the tailnet.
