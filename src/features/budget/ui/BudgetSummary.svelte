<script lang="ts">
  import { formatMoney } from "@/shared/domain"
  import type { Totals } from "../domain"

  let { totals }: { totals: Totals } = $props()
  const cells = $derived([
    { label: "Estimated", value: totals.estimated, over: false },
    { label: "Actual", value: totals.actual, over: false },
    { label: "Variance", value: totals.variance, over: totals.variance.minor > 0 },
  ])
</script>

<dl class="grid grid-cols-3 gap-2 text-sm" data-testid="budget-summary">
  {#each cells as cell (cell.label)}
    <div class="rounded-lg border p-2">
      <dt class="text-muted-foreground">{cell.label}</dt>
      <dd class="font-semibold tabular-nums {cell.over ? 'text-destructive' : ''}">
        {formatMoney(cell.value)}
      </dd>
    </div>
  {/each}
</dl>
