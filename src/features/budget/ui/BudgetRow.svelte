<script lang="ts">
  import { SquarePen } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { AppError } from "@/shared/domain"
  import { entryMeta, type BudgetEntry, type EntryForm } from "../domain"
  import BudgetRowEdit from "./BudgetRowEdit.svelte"

  interface Props {
    entry: BudgetEntry
    currency: string
    categories: readonly string[]
    deletable: boolean
    onEdit: (form: EntryForm) => Promise<AppError | null>
    onRemove: () => void
  }

  let { entry, currency, categories, deletable, onEdit, onRemove }: Props = $props()
  let editing = $state(false)
</script>

<li data-testid="budget-line">
  {#if editing}
    <BudgetRowEdit
      {entry}
      {currency}
      {categories}
      {deletable}
      onSave={onEdit}
      onCancel={() => (editing = false)}
      {onRemove}
    />
  {:else}
    <div class="flex min-h-14 items-center gap-item">
      <div class="flex min-w-0 flex-1 flex-col">
        <span class="type-label text-foreground">{entry.label}</span>
        <span class="type-xs text-muted-foreground">{entryMeta(entry, currency)}</span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit {entry.label}"
        onclick={() => (editing = true)}><SquarePen /></Button
      >
    </div>
  {/if}
</li>
