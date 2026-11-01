<script lang="ts">
  import { Pause, Play, RotateCcw, RotateCw } from "@lucide/svelte"
  import { FormError, FormState } from "@/shared/ui"
  import { Button } from "$lib/components/ui/button"
  import { canStart } from "../domain/party-machine"
  import { positionAt } from "../domain/timeline"
  import type { SessionView } from "../application/party-session"
  import type { PartyRoomState } from "./party-room-state.svelte"
  import PhaseLine from "./PhaseLine.svelte"

  /** Ready participants share playback and seeking controls. */
  let { room, view }: { room: PartyRoomState; view: SessionView } = $props()
  const action = new FormState()
  const phase = $derived(view.state.phase)
  const jump = (by: number) => room.seek(positionAt(view.state.timeline, room.now()) + by)
</script>

<section
  aria-label="Playback"
  class="flex flex-col gap-stack rounded-lg border border-border bg-card p-card"
>
  <PhaseLine {view} />
  <div class="flex flex-wrap gap-related">
    {#if !view.ready}
      <Button onclick={() => action.run(() => room.ready())}>I am ready</Button>
    {/if}
    {#if phase === "lobby"}
      <Button disabled={!view.ready || !canStart(view.state)} onclick={() => room.play()}>
        <Play aria-hidden="true" />
        Play for everyone
      </Button>
    {:else if phase === "playing"}
      <Button variant="outline" onclick={() => room.pause()}>
        <Pause aria-hidden="true" />
        Pause for everyone
      </Button>
    {:else if phase === "paused"}
      <Button onclick={() => room.play()}>
        <Play aria-hidden="true" />
        Play for everyone
      </Button>
    {/if}
    {#if view.ready && phase !== "lobby"}
      <Button variant="ghost" onclick={() => jump(-10)} aria-label="Back 10 seconds">
        <RotateCcw aria-hidden="true" />
      </Button>
      <Button variant="ghost" onclick={() => jump(10)} aria-label="Forward 10 seconds">
        <RotateCw aria-hidden="true" />
      </Button>
    {/if}
  </div>
  <FormError message={action.formError} />
</section>
