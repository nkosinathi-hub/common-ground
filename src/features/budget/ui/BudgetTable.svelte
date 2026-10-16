<script lang="ts">
  import { formatMoney, type AppError } from "@/shared/domain"
  import { totalsByCategory, type BudgetEntry, type EntryForm } from "../domain"
  import BudgetRow from "./BudgetRow.svelte"

  interface Props {
    entries: readonly BudgetEntry[]
    currency: string
    canDelete: (createdBy: string | null) => boolean
    onEdit: (base: BudgetEntry, form: EntryForm) => Promise<AppError | null>
    onRemove: (id: string) => void
  }

  let { entries, currency, canDelete, onEdit, onRemove }: Props = $props()
  const categories = $derived(totalsByCategory(entries, currency))
  const numeric = "p-1 text-right tabular-nums"
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
      {#each entries as entry (entry.id)}
        <BudgetRow
          {entry}
          {currency}
          deletable={canDelete(entry.createdBy)}
          onEdit={(form) => onEdit(entry, form)}
          onRemove={() => onRemove(entry.id)}
        />
      {:else}
        <tr><td colspan="5" class="p-1 text-muted-foreground">No budget lines yet.</td></tr>
      {/each}
    </tbody>
    {#if categories.length > 1}
      <tfoot>
        {#each categories as group (group.category)}
          <tr class="border-t font-medium">
            <td class="p-1" colspan="2">{group.category} total</td>
            <td class={numeric}>{formatMoney(group.estimated)}</td>
            <td class={numeric}>{formatMoney(group.actual)}</td>
            <td></td>
          </tr>
        {/each}
      </tfoot>
    {/if}
  </table>
</div>
