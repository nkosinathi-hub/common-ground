<script lang="ts">
  import { Progress } from "$lib/components/ui/progress"
  import { formatMoney } from "@/shared/domain"
  import { budgetSentence, type Totals } from "../domain"

  let { totals }: { totals: Totals } = $props()
  const cells = $derived([
    { label: "Estimated", value: totals.estimated },
    { label: "Actual", value: totals.actual },
  ])
  const spent = $derived(
    totals.estimated.minor > 0
      ? Math.min(100, (totals.actual.minor / totals.estimated.minor) * 100)
      : 0,
  )
  const sentence = $derived(budgetSentence(totals))
</script>

<!-- D10 stat tiles: estimated beside actual, a bar for what is spent, and what that means. -->
<div class="flex flex-col gap-item" data-testid="budget-summary">
  <dl class="grid grid-cols-2 gap-item">
    {#each cells as cell (cell.label)}
      <div class="flex flex-col gap-related rounded-md bg-muted p-inset">
        <dt class="type-sm text-muted-foreground">{cell.label}</dt>
        <dd class="type-h2 text-foreground tabular-nums">{formatMoney(cell.value)}</dd>
      </div>
    {/each}
  </dl>
  <Progress value={spent} class="h-1.5" aria-label="Spent of the estimate" />
  <p class="type-xs {sentence.over ? 'text-destructive' : 'text-muted-foreground'}">
    {sentence.text}
  </p>
</div>
