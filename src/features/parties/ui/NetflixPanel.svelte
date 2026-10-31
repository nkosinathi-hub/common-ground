<script lang="ts">
  import { ExternalLink, Pause, Play } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { netflixSearchUrl } from "../domain/netflix"
  import { canStart, hasPlayer } from "../domain/party-machine"
  import CoWatchPanel from "./CoWatchPanel.svelte"
  import type { PartyRoomState } from "./party-room-state.svelte"
  import PhaseLine from "./PhaseLine.svelte"

  /**
   * A Netflix party (#66): everyone plays it on netflix.com with the extension, and this page is
   * the lobby and the remote. With no extension connected it is the co-watch's 3-2-1 instead.
   */
  let { room, title }: { room: PartyRoomState; title: string } = $props()
  const view = $derived(room.view!)
  const phase = $derived(view.state.phase)
  const players = $derived(hasPlayer(view.state.people))
</script>

<section
  aria-label="On Netflix"
  class="flex flex-col gap-stack rounded-lg border border-border bg-card p-card"
>
  <Button
    variant="outline"
    href={netflixSearchUrl(title)}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ExternalLink aria-hidden="true" />
    Open {title} on Netflix
  </Button>
  <p class="type-sm text-muted-foreground">
    Each of you plays it on netflix.com in Chrome or Edge with the Common Ground extension, signed
    in to your own Netflix account, and presses Ready there. A phone is the remote.
  </p>
</section>
{#if players}
  <section
    aria-label="Remote"
    class="flex flex-col gap-stack rounded-lg border border-border bg-card p-card"
  >
    <PhaseLine {view} />
    <div class="flex flex-wrap gap-related">
      {#if phase === "lobby" && view.isHost}
        <Button disabled={!canStart(view.state)} onclick={() => room.play()}>
          <Play aria-hidden="true" />
          Play together
        </Button>
      {:else if phase === "playing" || phase === "waiting"}
        <Button variant="outline" onclick={() => room.pause()}>
          <Pause aria-hidden="true" />
          Pause for everyone
        </Button>
      {:else if phase === "paused"}
        <Button onclick={() => room.play()}>
          <Play aria-hidden="true" />
          Resume for everyone
        </Button>
      {/if}
    </div>
  </section>
{:else}
  <CoWatchPanel {room} />
{/if}
