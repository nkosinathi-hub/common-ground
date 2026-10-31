<script lang="ts">
  import { Pause, Play, Timer } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { countdownAt } from "../domain/countdown"
  import { describeRange } from "../domain/episode-range"
  import { canStart } from "../domain/party-machine"
  import type { PartyRoomState } from "./party-room-state.svelte"
  import PhaseLine from "./PhaseLine.svelte"

  interface Props {
    room: PartyRoomState
  }

  let { room }: Props = $props()
  const view = $derived(room.view!)
  const phase = $derived(view.state.phase)
  const what = $derived(room.party?.range ? describeRange(room.party.range) : "the film")
  let now = $state(0)

  $effect(() => {
    now = room.now()
    const timer = setInterval(() => (now = room.now()), 200)
    return () => clearInterval(timer)
  })
  const left = $derived(phase === "playing" ? countdownAt(view.state.timeline.at, now) : 0)
</script>

<section
  aria-label="Watching elsewhere"
  class="flex flex-col gap-stack rounded-lg border border-border bg-card p-card"
>
  <PhaseLine {view} />
  {#if left > 0}
    <p role="status" class="text-center type-display text-primary tabular-nums">{left}</p>
  {:else if phase === "playing"}
    <p role="status" class="text-center type-h3 text-foreground">Press play now</p>
  {/if}
  <div class="flex flex-wrap gap-related">
    {#if !view.ready}
      <Button onclick={() => room.ready()}>We are on {what}</Button>
    {/if}
    {#if phase === "lobby" && view.isHost}
      <Button disabled={!canStart(view.state)} onclick={() => room.countdown()}>
        <Timer aria-hidden="true" />
        Start the 3-2-1
      </Button>
    {:else if phase === "playing"}
      <Button variant="outline" onclick={() => room.pause()}>
        <Pause aria-hidden="true" />
        Pause for everyone
      </Button>
    {:else if phase === "paused"}
      <Button onclick={() => room.countdown()}>
        <Play aria-hidden="true" />
        Resume with a 3-2-1
      </Button>
    {/if}
  </div>
</section>
