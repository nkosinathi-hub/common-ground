<script lang="ts">
  import { Clapperboard } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { PageTool } from "@/shared/ui"
  import { useTitlePlayback } from "./title-playback.svelte"

  const playback = useTitlePlayback()
  let { inFab = false }: { inFab?: boolean } = $props()
</script>

{#if playback?.choices.trailerAvailable}
  {#if inFab}
    <PageTool
      label="Watch trailer"
      icon={Clapperboard}
      order={20}
      disabled={playback.play.status === "loading"}
      onclick={() => void playback.playTrailer()}
    />
  {:else}
    <Button
      variant="outline"
      size="icon"
      aria-label="Watch trailer"
      disabled={playback.play.status === "loading"}
      onclick={() => void playback.playTrailer()}
    >
      <Clapperboard />
    </Button>
  {/if}
{/if}
