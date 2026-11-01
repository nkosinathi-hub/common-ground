<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import type { EpisodeNumber } from "../application/ports"
  import PlayerSlot from "./PlayerSlot.svelte"
  import { useTitlePlayback } from "./title-playback.svelte"

  let { title, episode }: { title: string; episode?: EpisodeNumber } = $props()
  const playback = useTitlePlayback()
  $effect(() => {
    const selected = episode
    untrack(() => void playback?.playEpisode(selected))
    return () => playback?.play.close()
  })
</script>

<p class="type-sm text-muted-foreground">
  Let the video load, then tap “I am ready” to join shared playback.
</p>
<PlayerSlot {title} party />
{#if playback?.play.status === "error"}
  <Button variant="outline" onclick={() => playback?.playEpisode(episode)}>Retry playback</Button>
{/if}
