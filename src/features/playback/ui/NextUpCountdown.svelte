<script lang="ts">
  import { untrack } from "svelte"
  import { StepForward } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { NextUp } from "../application/ports"
  import { CountdownState } from "./countdown-state.svelte"
  let {
    next,
    due,
    auto = true,
    onplay,
    seconds = 10,
  }: {
    next: NextUp
    due: boolean
    auto?: boolean
    onplay: (next: NextUp) => void
    seconds?: number
  } = $props()
  let dismissed = $state(false)
  let played = false
  function play() {
    if (played) return
    played = true
    countdown.cancel()
    onplay(next)
  }
  const countdown = new CountdownState(play)
  $effect(() => {
    if (due && auto && !dismissed) untrack(() => countdown.start(seconds))
    return () => countdown.cancel()
  })
  const label = $derived(`S${next.season}E${next.episode}${next.title ? `: ${next.title}` : ""}`)
</script>

{#if due && !dismissed}
  <div class="rounded-md bg-background/90 p-item type-sm shadow" role="status" aria-live="polite">
    <p>Next up, {label}{countdown.running ? `, in ${countdown.remaining} s` : ""}</p>
    <div class="mt-2 flex gap-related">
      <Button size="sm" onclick={play}>Play now</Button>
      <Button
        size="sm"
        variant="ghost"
        onclick={() => {
          countdown.cancel()
          dismissed = true
        }}>Cancel</Button
      >
    </div>
  </div>
{:else}
  <Button size="sm" variant="secondary" title={label} onclick={play}>
    <StepForward aria-hidden="true" />Next episode
  </Button>
{/if}
