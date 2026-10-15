<script lang="ts">
  import { formatMoney, money } from "@/shared/domain"
  import { DeleteButton } from "@/shared/ui"
  import { totalsByCategory, type BudgetEntry } from "../domain"

  let {
    entries,
    currency,
    onRemove,
  }: { entries: readonly BudgetEntry[]; currency: string; onRemove: (id: string) => void } =
    $props()

  const fmt = (minor: number) => formatMoney(money(minor, currency))
  const categories = $derived(totalsByCategory(entries, currency))
  const num = "p-1 text-right tabular-nums"
</script>

<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead>
      <tr class="text-left text-muted-foreground">
        <th class="p-1">Category</th>
        <th class="p-1">Item</th>
        <th class="p-1 text-right">Estimated</th>
        <th class="p-1 text-right">Actual</th>
        <th class="p-1"><span class="sr-only">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      {#each entries as e (e.id)}
        <tr class="border-t">
          <td class="p-1">{e.category}</td>
          <td class="p-1">{e.label}</td>
          <td class={num}>{fmt(e.estimatedMinor)}</td>
          <td class={num}>{fmt(e.actualMinor)}</td>
          <td class="p-1 text-right">
            <DeleteButton
              label="Delete {e.label}"
              what="this budget line"
              onConfirm={() => onRemove(e.id)}
            />
          </td>
        </tr>
      {:else}
        <tr><td colspan="5" class="p-1 text-muted-foreground">No budget lines yet.</td></tr>
      {/each}
    </tbody>
    {#if categories.length > 1}
      <tfoot>
        {#each categories as c (c.category)}
          <tr class="border-t font-medium">
            <td class="p-1" colspan="2">{c.category} total</td>
            <td class={num}>{formatMoney(c.estimated)}</td>
            <td class={num}>{formatMoney(c.actual)}</td>
            <td></td>
          </tr>
        {/each}
      </tfoot>
    {/if}
  </table>
</div>
