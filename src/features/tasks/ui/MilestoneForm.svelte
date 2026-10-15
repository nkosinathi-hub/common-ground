<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Flag } from "@lucide/svelte"
  import type { AppError } from "@/shared/domain"
  import type { MilestoneInput } from "../domain"

  interface Props {
    error: AppError | null
    onAdd: (input: MilestoneInput) => Promise<boolean>
  }

  let { error, onAdd }: Props = $props()
  let draft = $state({ title: "", targetDate: "" })

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const added = await onAdd({ title: draft.title, targetDate: draft.targetDate || null })
    if (added) draft = { title: "", targetDate: "" }
  }
</script>

<form class="flex flex-wrap items-end gap-2" onsubmit={submit}>
  <Input
    class="w-56"
    aria-label="Milestone title"
    placeholder="New milestone"
    maxlength={200}
    bind:value={draft.title}
    aria-invalid={error?.field === "title" ? true : undefined}
  />
  <label class="flex flex-col text-xs"
    >Target date <Input type="date" class="h-8" bind:value={draft.targetDate} /></label
  >
  <Button type="submit" size="sm" disabled={!draft.title.trim()}><Flag />Add milestone</Button>
</form>
