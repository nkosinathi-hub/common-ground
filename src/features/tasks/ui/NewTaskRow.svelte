<script lang="ts">
  import { CalendarDays, Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { TITLE_MAX } from "@/shared/domain"
  import { FormError } from "@/shared/ui"
  import type { TasksState } from "./tasks-state.svelte"

  let { board }: { board: TasksState } = $props()
  let title = $state("")
  let due = $state("")
  let error = $state<string | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    const failure = await board.create(title, due || null)
    error = failure?.message ?? null
    if (failure) return
    title = ""
    due = ""
  }
</script>

<!-- D08: name it, optionally date it, add it; everything else is one tap away on the card. -->
<form class="flex flex-col gap-related" onsubmit={add} aria-label="Add a task">
  <div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-item">
    <div class="flex flex-col gap-related">
      <Label for="new-task">New task</Label>
      <Input
        id="new-task"
        placeholder="What needs doing?"
        maxlength={TITLE_MAX}
        bind:value={title}
      />
    </div>
    <div class="flex flex-col gap-related">
      <Label for="new-task-due">Due date</Label>
      <div class="relative">
        <CalendarDays
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input id="new-task-due" type="date" class="w-field-date pl-9" bind:value={due} />
      </div>
    </div>
    <Button type="submit" size="icon" aria-label="Add task" disabled={!title.trim()}
      ><Plus /></Button
    >
  </div>
  <FormError message={error} />
</form>
