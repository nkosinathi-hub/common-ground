<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import type { Milestone, MilestoneInput } from "../domain"

  interface Props {
    milestone: Milestone
    onSave: (input: MilestoneInput) => Promise<boolean>
    onCancel: () => void
  }

  let { milestone, onSave, onCancel }: Props = $props()
  // Seeded once from the milestone being edited; later prop changes must not wipe the draft.
  const seed = () => ({ title: milestone.title, targetDate: milestone.targetDate ?? "" })
  let draft = $state(seed())

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const saved = await onSave({ title: draft.title, targetDate: draft.targetDate || null })
    if (saved) onCancel()
  }
</script>

<form class="flex flex-wrap items-end gap-2" onsubmit={submit} aria-label="Edit milestone">
  <Input class="w-56" aria-label="Milestone title" maxlength={200} bind:value={draft.title} />
  <label class="flex flex-col text-xs"
    >Target date <Input type="date" class="h-8" bind:value={draft.targetDate} /></label
  >
  <Button type="submit" size="sm" disabled={!draft.title.trim()}>Save</Button>
  <Button type="button" size="sm" variant="ghost" onclick={onCancel}>Cancel</Button>
</form>
