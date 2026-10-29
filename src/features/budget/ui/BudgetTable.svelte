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
  const totals = $derived(totalsByCategory(entries, currency))
  const categories = $derived(totals.map((group) => group.category))
</script>

<!-- D10 budget lines; with more than one category, a total for each follows. -->
<ul class="flex flex-col divide-y divide-border border-t border-border" aria-label="Budget items">
  {#each entries as entry (entry.id)}
    <BudgetRow
      {entry}
      {currency}
      {categories}
      deletable={canDelete(entry.createdBy)}
      onEdit={(form) => onEdit(entry, form)}
      onRemove={() => onRemove(entry.id)}
    />
  {:else}
    <li class="py-item type-sm text-muted-foreground">No budget items yet.</li>
  {/each}
</ul>
{#if totals.length > 1}
  <dl class="flex flex-col gap-hairline type-xs text-muted-foreground" aria-label="By category">
    {#each totals as group (group.category)}
      <div class="flex justify-between gap-item">
        <dt>{group.category}</dt>
        <dd class="tabular-nums">
          {formatMoney(group.estimated)} estimated · {formatMoney(group.actual)} actual
        </dd>
      </div>
    {/each}
  </dl>
{/if}
