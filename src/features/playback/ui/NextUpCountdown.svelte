<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import type { NextUp } from "../application/ports"
  import { CountdownState } from "./countdown-state.svelte"

  interface Props {
    next: NextUp
    /** True once the episode ended or reached its credits. */
    due: boolean
    onplay: (next: NextUp) => void
    seconds?: number
  }

  let { next, due, onplay, seconds = 10 }: Props = $props()
  const countdown = new CountdownState(() => onplay(next))
  let dismissed = $state(false)

  $effect(() => {
    if (due && !dismissed) untrack(() => countdown.start(seconds))
    return () => countdown.cancel()
  })

  const label = $derived(`S${next.season}E${next.episode}${next.title ? `: ${next.title}` : ""}`)
</script>

{#if due && !dismissed}
  <div class="rounded-md bg-background/90 p-item type-sm shadow" role="status" aria-live="polite">
    <p>Next up, {label}{countdown.running ? `, in ${countdown.remaining} s` : ""}</p>
    <div class="mt-2 flex gap-related">
      <Button size="sm" onclick={() => onplay(next)}>Play now</Button>
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
{/if}
