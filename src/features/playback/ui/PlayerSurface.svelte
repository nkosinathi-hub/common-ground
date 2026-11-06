<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"
  import type { EngineHandle } from "./media-tracks"
  import EmbedEngine from "./EmbedEngine.svelte"
  import { engineFor } from "./player-logic"
  import ShakaEngine from "./ShakaEngine.svelte"
  import VideoEngine from "./VideoEngine.svelte"

  interface Props {
    loading?: boolean
    autoplay?: boolean
    source: PlayableSource | null
    handle?: EngineHandle | null
    title: string
    video?: HTMLVideoElement | null
    onfail: () => void
  }

  let {
    source,
    loading = false,
    autoplay = false,
    handle = $bindable(null),
    title,
    video = $bindable(null),
    onfail,
  }: Props = $props()
  const engine = $derived(source ? engineFor(source) : null)
</script>

<div class="relative aspect-video w-full flex-1 overflow-hidden rounded-md bg-black">
  {#if !source}
    <p
      class="grid h-full place-items-center p-inset text-center type-sm text-white"
      role={loading ? "status" : "alert"}
    >
      {loading
        ? "Refreshing playback…"
        : "None of the sources for this title would play. Try again later."}
    </p>
  {:else}
    {#key source}
      {#if engine === "embed"}
        <EmbedEngine {source} {title} />
      {:else if engine === "shaka"}
        <ShakaEngine {autoplay} {source} bind:handle bind:video {onfail} />
      {:else}
        <VideoEngine {autoplay} {source} bind:handle bind:video {onfail} />
      {/if}
    {/key}
  {/if}
</div>
