<script lang="ts">
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { DeleteButton } from "@/shared/ui"
  import { HYPOTHESIS_STATUSES, type Hypothesis, type HypothesisStatus } from "../domain"
  import { HYPOTHESIS_LABELS } from "./labels"

  interface Props {
    hypothesis: Hypothesis
    deletable: boolean
    onStatus: (status: HypothesisStatus) => void
    onRemove: () => void
  }

  let { hypothesis, deletable, onStatus, onRemove }: Props = $props()
</script>

<!-- D07 hypothesis: the statement, and how far testing it has got. -->
<li class="flex flex-col gap-item rounded-md border border-border p-inset" data-testid="hypothesis">
  <div class="flex items-start gap-item">
    <p class="min-w-0 flex-1 type-body text-foreground">{hypothesis.statement}</p>
    {#if deletable}
      <DeleteButton label="Delete hypothesis" what="this hypothesis" onConfirm={onRemove} />
    {/if}
  </div>
  <ToggleGroup.Root
    type="single"
    variant="segment"
    spacing={1}
    aria-label="Status"
    class="w-fit!"
    value={hypothesis.status}
    onValueChange={(value) => value && onStatus(value as HypothesisStatus)}
  >
    {#each HYPOTHESIS_STATUSES as status (status)}
      <ToggleGroup.Item value={status}>{HYPOTHESIS_LABELS[status]}</ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
</li>
