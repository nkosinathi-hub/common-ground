<script lang="ts">
  import { SvelteSet } from "svelte/reactivity"
  import { untrack } from "svelte"
  import { CountdownState } from "./countdown-state.svelte"
  import { SkipForward } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { activeSegment, SKIP_LABELS } from "../domain/progress"
  import type { Segment } from "../domain/source.types"

  interface Props {
    auto?: boolean
    segments: readonly Segment[]
    time: number
    onskip: (to: number) => void
  }

  let { segments, time, auto = false, onskip }: Props = $props()
  const segment = $derived(activeSegment(segments, time))
  const skipped = new SvelteSet<number>()
  const countdown = new CountdownState(() => {
    if (!segment || skipped.has(segment.start)) return
    skipped.add(segment.start)
    onskip(segment.end)
  })
  $effect(() => {
    if (auto && segment?.kind === "intro" && !skipped.has(segment.start))
      untrack(() => countdown.start(3))
    return () => countdown.cancel()
  })
</script>

{#if segment && Number.isFinite(segment.end)}
  <Button
    size="sm"
    variant="secondary"
    onclick={() => {
      countdown.cancel()
      skipped.add(segment.start)
      onskip(segment.end)
    }}
  >
    <SkipForward aria-hidden="true" />
    {SKIP_LABELS[segment.kind]}{countdown.running ? ` in ${countdown.remaining} s` : ""}
  </Button>
{/if}
