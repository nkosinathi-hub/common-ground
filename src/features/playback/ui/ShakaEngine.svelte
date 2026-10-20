<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"
  import type { CaptionChoice } from "./caption-pref"
  import { attachShaka, type EngineHandle } from "./shaka"

  interface Props {
    source: PlayableSource
    captions: CaptionChoice
    video?: HTMLVideoElement | null
    onfail: () => void
  }

  let { source, captions, video = $bindable(null), onfail }: Props = $props()
  let handle = $state<EngineHandle | null>(null)

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
      attached?.destroy()
    }
  })

  $effect(() => handle?.setCaptions(captions.on, captions.language))
</script>

<!-- playsinline keeps iOS from taking over the screen, so the skip and party overlays stay. -->
<video bind:this={video} class="h-full w-full bg-black" controls playsinline aria-label="Video">
</video>
