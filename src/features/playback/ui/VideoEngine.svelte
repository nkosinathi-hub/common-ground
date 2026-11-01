<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"
  import type { EngineHandle } from "./media-tracks"
  import { nativeTracks } from "./native-tracks"

  interface Props {
    source: PlayableSource
    handle?: EngineHandle | null
    video?: HTMLVideoElement | null
    onfail: () => void
  }

  let { source, handle = $bindable(null), video = $bindable(null), onfail }: Props = $props()

  $effect(() => {
    if (!video) return
    const current = nativeTracks(video)
    handle = current
    return () => {
      if (handle === current) handle = null
      current.destroy()
    }
  })

  function resume() {
    if (video && source.resumeSeconds) video.currentTime = source.resumeSeconds
  }
</script>

<!-- A plain file that needs no headers; anything needing headers goes through shaka. -->
<!-- Captions are the source's WebVTT tracks, rendered below whenever the source has them. -->
<!-- svelte-ignore a11y_media_has_caption -->
<video
  bind:this={video}
  class="h-full w-full bg-black"
  src={source.url}
  controls
  playsinline
  preload="metadata"
  aria-label="Video"
  onerror={onfail}
  onloadedmetadata={resume}
>
  {#each source.subtitles as track (track.url)}
    <track kind="captions" src={track.url} srclang={track.language} label={track.label} />
  {/each}
</video>
