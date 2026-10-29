<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import type { AppError } from "@/shared/domain"
  import { DeleteButton, FormError } from "@/shared/ui"
  import { entryFormOf, type BudgetEntry, type EntryForm } from "../domain"
  import EntryFields from "./EntryFields.svelte"

  interface Props {
    entry: BudgetEntry
    currency: string
    categories: readonly string[]
    deletable: boolean
    onSave: (form: EntryForm) => Promise<AppError | null>
    onCancel: () => void
    onRemove: () => void
  }

  let { entry, currency, categories, deletable, onSave, onCancel, onRemove }: Props = $props()
  // Seeded once from the line being edited; later prop changes must not wipe the draft.
  const seed = () => entryFormOf(entry)
  let form = $state(seed())
  let error = $state<AppError | null>(null)

  async function save(event: SubmitEvent) {
    event.preventDefault()
    error = await onSave(form)
    if (!error) onCancel()
  }
</script>

<!-- A line opens in place to edit; delete waits here rather than on every row. -->
<form class="flex flex-col gap-stack py-item" onsubmit={save} aria-label="Edit {entry.label}">
  <p class="type-label text-foreground">{entry.label}</p>
  <EntryFields id="line-{entry.id}" bind:form {currency} {error} {categories} />
  <FormError message={error?.message} />
  <div class="flex items-center gap-item">
    <Button type="submit" size="sm">Save</Button>
    <Button type="button" size="sm" variant="ghost" onclick={onCancel}>Cancel</Button>
    {#if deletable}
      <span class="ml-auto"
        ><DeleteButton
          label="Delete {entry.label}"
          what="this budget line"
          onConfirm={onRemove}
        /></span
      >
    {/if}
  </div>
</form>
