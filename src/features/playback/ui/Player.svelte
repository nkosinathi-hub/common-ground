<script lang="ts">
  import { untrack } from "svelte"
  import type { PlayerProps } from "./player-props"
  import type { NextUp } from "../application/ports"
  import { captionPreference } from "./caption-pref"
  import { usePlayback } from "./context"
  import PlayerControls from "./PlayerControls.svelte"
  import PlayerMedia from "./PlayerMedia.svelte"
  import SourcePicker from "./SourcePicker.svelte"
  import { PlayerPosition } from "./player-position.svelte"
  import { keyAction } from "./player-logic"
  import { applyKey } from "./track-playback"

  let {
    playing,
    target,
    title,
    onclose,
    onnext,
    onwatched,
    onretry,
    party = false,
  }: PlayerProps = $props()
  const { service, device, attachVideo } = usePlayback()
  const prefs = captionPreference(device)
  let captions = $state(prefs.read())
  let index = $state(0)
  let video = $state<HTMLVideoElement | null>(null)
  let container = $state<HTMLElement | null>(null)
  let resume = $state<number | null>(null)
  let theatre = $state(false)
  let next = $state<NextUp | null>(null)
  const source = $derived.by(() => {
    const chosen = playing.sources[index] ?? null
    return chosen && resume !== null ? { ...chosen, resumeSeconds: resume } : chosen
  })
  const position = new PlayerPosition(
    () => video,
    () => (source ? service.reporter(source, target, playing.ref, onwatched) : null),
  )
  function selectSource(next: number) {
    resume = position.time
    index = next
  }
  const fail = () => selectSource(index + 1)

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
    if (!action || /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test((event.target as HTMLElement).tagName))
      return
    event.preventDefault()
    applyKey(action, { video, container, toggleCaptions })
  }

  const inCredits = $derived(
    source?.segments.some(
      (s) => s.kind === "credits" && position.time >= s.start && position.time < s.end,
    ) ?? false,
  )
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section
  bind:this={container}
  data-player-focus
  aria-label={`Player: ${title}`}
  tabindex="-1"
  class={theatre ? "fixed inset-0 z-50 flex flex-col bg-black p-2" : "flex flex-col gap-related"}
  {onkeydown}
>
  <SourcePicker sources={playing.sources} {index} onchange={selectSource} {onretry} />
  <PlayerMedia {source} bind:captions {title} bind:video onfail={fail} />
  <PlayerControls
    {source}
    time={position.time}
    next={party ? null : next}
    {captions}
    {theatre}
    due={position.ended || inCredits}
    onskip={(to) => video && (video.currentTime = to)}
    onnext={(n) => onnext({ season: n.season, episode: n.episode })}
    oncaptions={toggleCaptions}
    ontheatre={() => (theatre = !theatre)}
    {onclose}
  />
</section>
