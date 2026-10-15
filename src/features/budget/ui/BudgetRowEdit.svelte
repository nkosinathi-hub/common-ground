<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import type { AppError } from "@/shared/domain"
  import { entryFormOf, LABEL_MAX, type BudgetEntry, type EntryForm } from "../domain"

  interface Props {
    entry: BudgetEntry
    currency: string
    onSave: (form: EntryForm) => Promise<AppError | null>
    onCancel: () => void
  }

  let { entry, currency, onSave, onCancel }: Props = $props()
  // Seeded once from the line being edited; later prop changes must not wipe the draft.
  const seed = () => entryFormOf(entry)
  let form = $state(seed())
  let error = $state<AppError | null>(null)
  const invalid = (field: string) => (error?.field === field ? true : undefined)

  async function save() {
    error = await onSave(form)
    if (!error) onCancel()
  }
</script>

<tr class="border-t" aria-label="Edit {entry.label}">
  <td class="p-1">{entry.category}</td>
  <td class="p-1">
    <Input
      aria-label="Item"
      maxlength={LABEL_MAX}
      bind:value={form.label}
      aria-invalid={invalid("label")}
    />
  </td>
  <td class="p-1">
    <Input
      aria-label="Estimated ({currency})"
      inputmode="decimal"
      bind:value={form.estimated}
      aria-invalid={invalid("estimated")}
    />
  </td>
  <td class="p-1">
    <Input
      aria-label="Actual ({currency})"
      inputmode="decimal"
      bind:value={form.actual}
      aria-invalid={invalid("actual")}
    />
  </td>
  <td class="p-1 text-right whitespace-nowrap">
    <Button size="sm" onclick={save}>Save</Button>
    <Button size="sm" variant="ghost" onclick={onCancel}>Cancel</Button>
    {#if error}<p class="text-sm text-destructive" role="alert">{error.message}</p>{/if}
  </td>
</tr>
