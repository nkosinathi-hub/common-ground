<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import type { Result } from "@/shared/domain"
  import { DeleteButton } from "@/shared/ui"
  import { checklistProgress, type ChecklistItem, type Task } from "../domain"
  import { useTasks } from "./context"

  let { task }: { task: Task } = $props()
  const uc = useTasks()
  let items = $state<ChecklistItem[]>([])
  let label = $state("")
  let error = $state<string | null>(null)

  $effect(() => {
    void uc.checklist(task.id).then((r) => (r.ok ? (items = r.value) : (error = r.error.message)))
  })

  async function run<T>(write: Promise<Result<T>>, apply: (value: T) => void) {
    const result = await write
    if (result.ok) apply(result.value)
    error = result.ok ? null : result.error.message
  }
  const add = (e: SubmitEvent) => (
    e.preventDefault(),
    run(
      uc.addItem(task.spaceId, task.id, label, items),
      (item) => ((items = [...items, item]), (label = "")),
    )
  )
  const toggle = (id: string, done: boolean) =>
    run(uc.toggleItem(id, done), (item) => (items = items.map((i) => (i.id === id ? item : i))))
  const remove = (id: string) =>
    run(uc.removeItem(id), () => (items = items.filter((i) => i.id !== id)))
  const progress = $derived(checklistProgress(items))
</script>

<div class="flex flex-col gap-1" aria-label="Checklist for {task.title}">
  {#if progress.total > 0}<p class="text-xs text-muted-foreground">
      {progress.done} of {progress.total} done
    </p>{/if}
  <ul class="flex flex-col gap-1">
    {#each items as item (item.id)}
      <li class="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          id="item-{item.id}"
          checked={item.done}
          onchange={(e) => toggle(item.id, e.currentTarget.checked)}
        />
        <label for="item-{item.id}" class={item.done ? "text-muted-foreground line-through" : ""}
          >{item.label}</label
        >
        <DeleteButton
          label="Remove {item.label}"
          what="this checklist item"
          onConfirm={() => remove(item.id)}
        />
      </li>
    {/each}
  </ul>
  <form class="flex gap-1" onsubmit={add}>
    <Input
      class="h-7 text-xs"
      aria-label="New checklist item"
      placeholder="Add an item"
      maxlength={200}
      bind:value={label}
    />
  </form>
  {#if error}<p class="text-xs text-destructive" role="alert">{error}</p>{/if}
</div>
