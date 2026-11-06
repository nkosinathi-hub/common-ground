<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"
  import { attachShaka, type EngineHandle } from "./shaka"

  interface Props {
    autoplay?: boolean
    source: PlayableSource
    handle?: EngineHandle | null
    video?: HTMLVideoElement | null
    onfail: () => void
  }

  let {
    source,
    autoplay = false,
    handle = $bindable(null),
    video = $bindable(null),
    onfail,
  }: Props = $props()

  $effect(() => {
    const element = video
    if (!element) return
    let live = true
    let attached: EngineHandle | null = null
    void attachShaka(element, source, () => live && onfail()).then((h) => {
      attached = h
      if (live) handle = h
      else h.destroy()
    })
    return () => {
      live = false
      if (handle === attached) handle = null
      attached?.destroy()
    }
  })
</script>

<!-- playsinline keeps iOS from taking over the screen, so the skip and party overlays stay. -->
<video
  bind:this={video}
  class="h-full w-full bg-black"
  {autoplay}
  controls
  playsinline
  aria-label="Video"
>
</video>
