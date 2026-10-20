<script lang="ts">
  import type { PlayableSource } from "../domain/source.types"
  import type { CaptionChoice } from "./caption-pref"
  import EmbedEngine from "./EmbedEngine.svelte"
  import { engineFor } from "./player-logic"
  import ShakaEngine from "./ShakaEngine.svelte"
  import VideoEngine from "./VideoEngine.svelte"

  interface Props {
    source: PlayableSource | null
    captions: CaptionChoice
    title: string
    video?: HTMLVideoElement | null
    onfail: () => void
  }

  let { source, captions, title, video = $bindable(null), onfail }: Props = $props()
  const engine = $derived(source ? engineFor(source) : null)
</script>

<div class="relative aspect-video w-full flex-1 overflow-hidden rounded-md bg-black">
  {#if !source}
    <p class="grid h-full place-items-center p-4 text-center text-sm text-white" role="alert">
      None of the sources for this title would play. Try again later.
    </p>
  {:else}
    {#key source}
      {#if engine === "embed"}
        <EmbedEngine {source} {title} />
      {:else if engine === "shaka"}
        <ShakaEngine {source} {captions} bind:video {onfail} />
      {:else}
        <VideoEngine {source} {captions} bind:video {onfail} />
      {/if}
    {/key}
  {/if}
</div>
