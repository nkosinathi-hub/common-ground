<script lang="ts">
  import { untrack } from "svelte"
  import type { Playing } from "../application/playback-service"
  import type { EpisodeNumber, NextUp, PlayTarget } from "../application/ports"
  import { captionPreference } from "./caption-pref"
  import { usePlayback } from "./context"
  import PlayerControls from "./PlayerControls.svelte"
  import PlayerSurface from "./PlayerSurface.svelte"
  import { keyAction } from "./player-logic"
  import { applyKey, trackPlayback } from "./track-playback"

  interface Props {
    playing: Playing
    target: PlayTarget
    title: string
    onclose: () => void
    onnext: (episode: EpisodeNumber) => void
    onwatched?: () => void
  }

  let { playing, target, title, onclose, onnext, onwatched }: Props = $props()
  const { service, device, attachVideo } = usePlayback()
  const prefs = captionPreference(device)
  let captions = $state(prefs.read())
  let index = $state(0)
  let video = $state<HTMLVideoElement | null>(null)
  let container = $state<HTMLElement | null>(null)
  let time = $state(0)
  let ended = $state(false)
  let theatre = $state(false)
  let next = $state<NextUp | null>(null)
  const source = $derived(playing.sources[index] ?? null)
  /** A failing source hands over to the next ranked one; the list running out is the end. */
  const fail = () => (index += 1)

  $effect(() => {
    if (!video || !source) return
    const element = video
    const reporter = untrack(() => service.reporter(source, target, playing.ref, onwatched))
    const update = () => {
      time = element.currentTime
      ended = element.ended
    }
    element.addEventListener("timeupdate", update)
    element.addEventListener("ended", update)
    const detach = trackPlayback(element, reporter)
    return () => {
      element.removeEventListener("timeupdate", update)
      element.removeEventListener("ended", update)
      detach()
    }
  })
  $effect(() => (video && attachVideo ? untrack(() => attachVideo(video!)) : undefined))

  $effect(() => {
    void service.nextUp(target, playing.ref).then((r) => (next = r.ok ? r.value : null))
  })

  function toggleCaptions() {
    const language = captions.language ?? source?.subtitles[0]?.language ?? null
    captions = { on: !captions.on, language }
    prefs.write(captions)
  }

  function onkeydown(event: KeyboardEvent) {
    const action = keyAction(event.key)
    if (!action || (event.target as HTMLElement).tagName === "BUTTON") return
    event.preventDefault()
    applyKey(action, { video, container, toggleCaptions })
  }

  const inCredits = $derived(
    source?.segments.some((s) => s.kind === "credits" && time >= s.start && time < s.end) ?? false,
  )
</script>

<!-- Media-player shortcuts are handled for the whole player while focus is inside it. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
  bind:this={container}
  aria-label={`Player: ${title}`}
  tabindex="-1"
  class={theatre ? "fixed inset-0 z-50 flex flex-col bg-black p-2" : "space-y-2"}
  {onkeydown}
>
  <PlayerSurface {source} {captions} {title} bind:video onfail={fail} />
  <PlayerControls
    {source}
    {time}
    {next}
    {captions}
    {theatre}
    due={ended || inCredits}
    onskip={(to) => video && (video.currentTime = to)}
    onnext={(n) => onnext({ season: n.season, episode: n.episode })}
    oncaptions={toggleCaptions}
    ontheatre={() => (theatre = !theatre)}
    {onclose}
  />
</section>
