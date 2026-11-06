<script lang="ts">
  import { untrack, onDestroy } from "svelte"
  import type { PlayerProps } from "./player-props"
  import { captionPreference } from "./caption-pref"
  import { usePlayback } from "./context"
  import PlayerControls from "./PlayerControls.svelte"
  import PlayerMedia from "./PlayerMedia.svelte"
  import PlaybackOptions from "./PlaybackOptions.svelte"
  import { PlayerPosition } from "./player-position.svelte"
  import { SourceSession } from "./source-session.svelte"
  import { PlayerTimeline } from "./player-timeline.svelte"
  import { sourceExpiry } from "./source-expiry"
  import { watchMedia, pauseToPreserve } from "./media-recovery"
  import { playbackPreference } from "./playback-preferences"
  import { inCredits } from "../domain/progress"
  import { playerKeyboard } from "./player-keyboard"

  let {
    playing,
    target,
    title,
    onclose,
    onnext,
    onwatched,
    onretry,
    party = false,
    preview = false,
  }: PlayerProps = $props()
  const { service, device, attachVideo } = usePlayback()
  const prefs = captionPreference(device)
  let captions = $state(prefs.read())
  let video = $state<HTMLVideoElement | null>(null)
  let container = $state<HTMLElement | null>(null)
  let theatre = $state(false)
  const session = untrack(() => new SourceSession(playing, service, target, !preview))
  const timeline = untrack(() => new PlayerTimeline(service, target, playing, preview))
  const source = $derived(session.source)
  const segments = $derived(source?.segments.length ? source.segments : timeline.segments)
  const position = new PlayerPosition(
    () => video,
    () => (source ? service.reporter(source, target, playing.ref, onwatched) : null),
  )
  const paused = $derived(pauseToPreserve(video, position.paused))
  const fail = () => void session.fail(source, position.time, false, paused)
  onDestroy(session.dispose)
  $effect(() => (video && attachVideo ? untrack(() => attachVideo(video!)) : undefined))
  $effect(() => (video ? watchMedia(video, fail, 20_000, session.ready) : undefined))
  $effect(() => sourceExpiry(source, () => void session.fail(source, position.time, true, paused)))

  function toggleCaptions() {
    const language = captions.language ?? source?.subtitles[0]?.language ?? null
    captions = { on: !captions.on, language }
    prefs.write(captions)
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
  bind:this={container}
  data-player-focus
  aria-label={`Player: ${title}`}
  tabindex="-1"
  class={theatre
    ? "fixed inset-0 z-50 flex flex-col bg-black p-2"
    : "flex min-h-0 flex-1 flex-col gap-related"}
  onkeydown={(event) => playerKeyboard(event, { video, container, toggleCaptions })}
>
  <PlaybackOptions {session} time={position.time} {paused} {onretry} />
  <PlayerMedia
    loading={session.refreshing}
    {source}
    bind:captions
    {title}
    bind:video
    autoplay={!party && session.autoplay}
    onfail={fail}
  />
  <PlayerControls
    {source}
    time={position.time}
    next={party || preview ? null : timeline.next}
    {segments}
    autoIntro={!party &&
      !preview &&
      !position.paused &&
      playbackPreference(device, "playback-auto-intro")}
    autoNext={!party &&
      (position.ended || !position.paused) &&
      playbackPreference(device, "playback-auto-next")}
    {captions}
    {theatre}
    due={position.ended || inCredits(segments, position.time)}
    onskip={(to) => video && (video.currentTime = to)}
    onnext={(n) => onnext({ season: n.season, episode: n.episode })}
    oncaptions={toggleCaptions}
    ontheatre={party ? () => (theatre = !theatre) : undefined}
    {onclose}
  />
</section>
