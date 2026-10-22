# Watch parties

Watching a title together, in the app in sync (#57), on a TV elsewhere as a co-watch (#58), or on
netflix.com with the browser extension (#66, `docs/runbooks/netflix-party.md`).
Code: `src/features/parties`. Data: `supabase/migrations/20261022000100` (history and together) and `20261022001100-001900`.

## Server: who is in, and what gets credited

- `start_party(item, src, s1, e1, s2, e2, counts)` opens a party (`planned`), puts the host in and
  notifies every other space member (`watch_party`, pushed as "X started a watch party"). One open
  party per title. A film names no episodes; a series names a forward range, and `counts` gives the
  episode count of every season the range leaves (the client passes them from TMDB).
- `join_party`, `confirm_party` (joins too), `cancel_party` (host only), `handover_party` (a
  member takes over). The host confirming makes the party `live`.
- `finish_party` (a confirmed member, live party): every confirmed member gets one
  `episode_watches` row per episode (source `party`; a film is one row with no episode). Together
  progress moves to the last episode only when every current space member confirmed, and never
  backwards. Unconfirmed members and expired parties are credited nothing.
- pg_cron `watch-party-expiry` (every 15 minutes) cancels planned parties after 6 hours and live
  ones 12 hours after they started.

The other v0.5 stream owns `episode_watches` triggers and personal pointers: a party row must move
a member's personal pointer forward only, through the same trigger as any other source.

## Realtime: private channel `party:<id>`

RLS on `realtime.messages` lets only members of that open party receive (select) and send
(insert), separately for broadcast and presence (`20261022001600_party_realtime.sql`, tested in
`supabase/tests/database/parties/party_realtime.test.sql`). Deploy: in the project's Realtime
settings, "Allow public access" must be off, or a client could open a public channel by the same
name and skip the policies.

The client heartbeat runs in a Web Worker (`realtime.worker`, CSP `worker-src 'self' blob:`). A
missed heartbeat shows "reconnecting"; coming back to the app reconnects and asks the host for
the state again.

## Sync protocol

Every member runs the same state machine (`domain/party-machine.ts`) on the same events.

- Clock: the host's clock is the reference. Members ping the host each second and keep the eight
  latest samples; the offset is the median of the fastest half (NTP-style, `domain/clock.ts`).
- Start: everyone taps Ready (this also arms playback inside the tap, for iOS Safari), then the
  host plays. Play is scheduled at least 300 ms (or one round trip) ahead.
- Drift (`domain/drift.ts`, Syncplay-like): within 0.1 s nothing; up to 2 s the rate moves by
  5%; up to 4 s by 10%; beyond 4 s a seek.
- Buffering: while anyone buffers, everyone waits; the host resumes once nobody does.
- The host owns seeks; anyone pauses and plays. The host broadcasts the state every second, so a
  late joiner (or a rejoin) gets a snapshot at once.
- Handover: a host missing from presence for 15 s is replaced by the earliest-joined member
  present (ties by user id), which every client computes alike; that member calls
  `handover_party`.
- Co-watch: the same session with no player. "We are on S2E3" confirms, the host's 3-2-1 is a
  play scheduled 3 s ahead, pause and resume show on both screens, "We finished" finishes.

- Netflix (#66): the extension is a `player` in presence and the app beside it a `remote`
  (`domain/presence.ts`). A start waits only for the players while any are connected. The
  host's remote follows the host's player (which keeps the clock and sends the state); with no
  player of the host's, the host's remote keeps the clock. A member's two devices tell their
  pongs apart by ping id. With no player at all, the page is the co-watch's 3-2-1.

Constants live in `domain/sync-constants.ts`.

Host-only rules (seeks, starting) are enforced client-side over broadcast. That is enough for
members of one space who trust each other; the RPCs stay authoritative for membership and progress.

## Player contract

The player feature implements `PlayerControl` (`application/ports.ts`): `play()` (a promise; may
need a gesture the first time), `pause()`, `seek(seconds)`, `setRate(rate)`, `currentTime()` in
seconds, and `onBuffering(listener)` reporting stalls and recovery. It is provided through
`providePartiesFeature` in `src/app/composition/parties.ts`; until then a jellyfin party runs its
controls without a picture. The extension implements it over netflix.com
(`extension/src/netflix-player.ts`): the page's video for play, pause, position, rate and
buffering, and Netflix's page player API for seeks, through a MAIN-world script.
