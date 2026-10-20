<script lang="ts">
  import { SkipForward } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { activeSegment, SKIP_LABELS } from "../domain/progress"
  import type { Segment } from "../domain/source.types"

  interface Props {
    segments: readonly Segment[]
    time: number
    onskip: (to: number) => void
  }

  let { segments, time, onskip }: Props = $props()
  const segment = $derived(activeSegment(segments, time))
</script>

{#if segment}
  <Button size="sm" variant="secondary" onclick={() => onskip(segment.end)}>
    <SkipForward aria-hidden="true" />
    {SKIP_LABELS[segment.kind]}
  </Button>
{/if}
