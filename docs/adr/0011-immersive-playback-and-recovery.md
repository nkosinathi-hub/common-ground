# 0011: Immersive playback with bounded recovery

Status: accepted for implementation, pending review

## Context

Touch required two activations for the page action. Title details duplicated About controls,
episode selection was ambiguous, and next episode depended on a signed-in Jellyfin account.
Source expiry metadata was collected but never renewed. The demo disabled the real player.

## Decision

- Supersede ADR 0010's touch-first-disclosure rule: the action icon and first tap run the action
  on every device. Hold and drag retain navigation. Title tools also appear under the app logo,
  so touch users can reach secondary actions without invoking playback.
  Touch release activates once. Capture and consume its compatibility click before it can dismiss
  the new modal. Some touch sequences omit that click, so release remains authoritative. Reset
  suppression on the next pointer down; keyboard and mouse clicks remain native.
- Retain the compact title header and visible episode list. Show the loading/playing episode,
  season and name separately from the suggested continuation. Details live in the action menus.
- Play opens a fullscreen modal with focus containment, scroll locking and Escape/Back to title.
  Party playback stays inline with its shared controls. A new episode gets a new player session,
  preventing old source indexes, callbacks and countdowns from leaking into it.
- Source selection and audio/subtitles use closed native disclosures. Jellyfin sign-in and sign-out
  move to user Account settings. Tokens remain on the device.
- Resolve the following episode from catalog ordering and actual season boundaries, regardless
  of Jellyfin. Offer a manual Next episode throughout playback and an automatic end countdown.
- Fetch optional TheIntroDB timing metadata in parallel with playback. Never guess intro lengths.
  Known intros offer a button and automatic skipping. Intros and next-episode automation have
  persistent device preferences, enabled by default. Party playback keeps manual shared control.
- Retry transient segment requests and retain a modest buffer. A stuck playing video gets a finite
  recovery budget; brief seeks get extra time; pause and offline state do not count as stalled playback. Preserve position
  across fallback, invalidate CinePro's cached response through its existing GET refresh endpoint,
  and resolve again through normal origin validation. Ignore duplicate and stale failures.
- Refresh advertised expiring URLs. Repeated recovery without playback progress stops; a new
  recovery budget requires another minute of media progression. Closing aborts pending recovery.
- The demo uses the same player with a bundled, labelled synthetic clip and sample next episodes.
  Demo success does not certify a real provider. Live continuity checks force public DNS addresses
  and assert the actual connected address, so a tailnet route cannot produce a false pass.

## Provider choice

The deployed CinePro health endpoint already lists VidRock among its upstream providers. VidRock's
public embed documentation does not establish a reliability guarantee or control parity with the
native player. Keep provider isolation and direct playback rather than replace it with an unverified
iframe that loses our subtitle uploads and shared video controls. Re-evaluate after measured failures.

## Limits

Community timing coverage varies and alternate edits can differ. Unavailable timing data never
blocks playback. Browsers may require another gesture for audible autoplay. Desktop Chromium with
public address pinning tests network reachability and media continuity, not physical iOS/Android.
Third-party availability still needs ongoing observation; no player can manufacture a missing source.

References: https://help.netflix.com/en/node/121518,
https://theintrodb.org/docs, https://vidrock.to/,
https://github.com/omss-spec/omss-spec/blob/main/spec/v1.0/omss-v1.0.md,
https://github.com/shaka-project/shaka-player/blob/main/docs/tutorials/network-and-buffering-config.md.
