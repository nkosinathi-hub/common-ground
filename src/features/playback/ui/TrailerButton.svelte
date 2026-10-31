<script lang="ts">
  import { Clapperboard } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { useTitlePlayback } from "./title-playback.svelte"

  const playback = useTitlePlayback()
</script>

{#if playback?.choices.trailerAvailable}
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
