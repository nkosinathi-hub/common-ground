<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Pencil } from "@lucide/svelte"
  import { formatMoney, money, type AppError } from "@/shared/domain"
  import { DeleteButton } from "@/shared/ui"
  import type { BudgetEntry, EntryForm } from "../domain"
  import BudgetRowEdit from "./BudgetRowEdit.svelte"

  interface Props {
    entry: BudgetEntry
    currency: string
    onEdit: (form: EntryForm) => Promise<AppError | null>
    onRemove: () => void
  }

  let { entry, currency, onEdit, onRemove }: Props = $props()
  let editing = $state(false)
  const amount = (minor: number) => formatMoney(money(minor, currency))
  const numeric = "p-1 text-right tabular-nums"
</script>

{#if editing}
  <BudgetRowEdit {entry} {currency} onSave={onEdit} onCancel={() => (editing = false)} />
{:else}
  <tr class="border-t">
    <td class="p-1">{entry.category}</td>
    <td class="p-1">{entry.label}</td>
    <td class={numeric}>{amount(entry.estimatedMinor)}</td>
    <td class={numeric}>{amount(entry.actualMinor)}</td>
    <td class="p-1 text-right whitespace-nowrap">
      <Button
        size="icon"
        variant="ghost"
        aria-label="Edit {entry.label}"
        onclick={() => (editing = true)}><Pencil /></Button
      >
      <DeleteButton label="Delete {entry.label}" what="this budget line" onConfirm={onRemove} />
    </td>
  </tr>
{/if}
