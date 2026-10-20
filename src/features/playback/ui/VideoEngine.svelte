<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"
  import type { CaptionChoice } from "./caption-pref"

  interface Props {
    source: PlayableSource
    captions: CaptionChoice
    video?: HTMLVideoElement | null
    onfail: () => void
  }

  let { source, captions, video = $bindable(null), onfail }: Props = $props()

  $effect(() => {
    if (!video) return
    const tracks = Array.from(video.textTracks)
    const chosen = tracks.find((t) => t.language === captions.language) ?? tracks[0]
    for (const track of tracks) track.mode = captions.on && track === chosen ? "showing" : "hidden"
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
