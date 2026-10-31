<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import { type AppError } from "@/shared/domain"
  import { DeleteButton, FormError, FormField } from "@/shared/ui"
  import type { Milestone, MilestoneInput } from "../domain"

  interface Props {
    /** The milestone being edited; absent, the card adds a new one. */
    milestone?: Milestone
    deletable?: boolean
    error: AppError | null
    onSave: (input: MilestoneInput, done: boolean) => Promise<boolean>
    onCancel?: () => void
    onRemove?: () => void
  }

  let { milestone, deletable = false, error, onSave, onCancel, onRemove }: Props = $props()
  // Seeded once from the milestone being edited; later prop changes must not wipe the draft.
  const seed = () => ({
    title: milestone?.title ?? "",
    targetDate: milestone?.targetDate ?? "",
    done: milestone?.completedAt != null,
  })
  let draft = $state(untrack(seed))
  const id = (field: string) => `milestone-${milestone?.id ?? "new"}-${field}`

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const saved = await onSave(
      { title: draft.title, targetDate: draft.targetDate || null },
      draft.done,
    )
    if (saved && !milestone) draft = seed()
    if (saved) onCancel?.()
  }
</script>

<!-- D10 "Add milestone", or "Edit milestone" with completion and delete. -->
<Card.Root>
  <Card.Header
    ><Card.Title>{milestone ? "Edit milestone" : "Add milestone"}</Card.Title></Card.Header
  >
  <Card.Content>
    <form
      class="flex flex-col gap-stack"
      onsubmit={submit}
      aria-label={milestone ? "Edit milestone" : "Add a milestone"}
    >
      <FormField
        id={id("title")}
        label="Milestone title"
        bind:value={draft.title}
        error={error?.field === "title" ? error.message : undefined}
      />
      <FormField
        id={id("target")}
        label="Target date"
        type="date"
        required={false}
        bind:value={draft.targetDate}
      />
      {#if milestone}
        <Label class="flex items-center gap-related">
          <Checkbox bind:checked={draft.done} />Mark as completed
        </Label>
      {/if}
      <FormError message={error && !error.field ? error.message : null} />
      <div class="flex flex-wrap items-center gap-item">
        <Button type="submit" disabled={!draft.title.trim()}
          >{milestone ? "Save milestone" : "Add milestone"}</Button
        >
        {#if onCancel}<Button type="button" variant="ghost" onclick={onCancel}>Cancel</Button>{/if}
        {#if milestone && deletable && onRemove}
          <span class="ml-auto">
            <DeleteButton
              label="Delete milestone {milestone.title}"
              what="this milestone"
              description="Tasks linked to it stay, without a milestone."
              onConfirm={onRemove}
            />
          </span>
        {/if}
      </div>
    </form>
  </Card.Content>
</Card.Root>
