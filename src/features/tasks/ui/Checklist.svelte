<script lang="ts">
  import { untrack } from "svelte"
  import { Input } from "$lib/components/ui/input"
  import type { Result } from "@/shared/domain"
  import { AsyncView, DeleteButton, Resource } from "@/shared/ui"
  import { checklistProgress, LABEL_MAX, type ChecklistItem, type Task } from "../domain"
  import { useTasks } from "./context"

  type Change<T> = (value: T, items: ChecklistItem[]) => ChecklistItem[]

  interface Props {
    task: Task
  }

  let { task }: Props = $props()
  const { checklist } = useTasks()
  const items = new Resource<ChecklistItem[]>(() => checklist.list(untrack(() => task.id)))
  let label = $state("")
  let error = $state<string | null>(null)
  // Reloads when the card shows another task.
  $effect(() => {
    void task.id
    void items.load()
  })
  const current = () => items.value ?? []
  const progress = $derived(checklistProgress(items.value ?? []))

  async function run<T>(write: Promise<Result<T>>, change: Change<T>): Promise<boolean> {
    const result = await write
    if (result.ok) items.set(change(result.value, current()))
    error = result.ok ? null : result.error.message
    return result.ok
  }

  async function add(event: SubmitEvent) {
    event.preventDefault()
    const added = await run(checklist.add(task, label, current()), (item, list) => [...list, item])
    if (added) label = ""
  }

  const toggle = (id: string, done: boolean) =>
    run(checklist.toggle(id, done), (item, list) =>
      list.map((entry) => (entry.id === id ? item : entry)),
    )
  const remove = (id: string) =>
    run(checklist.remove(id), (_removed, list) => list.filter((entry) => entry.id !== id))
</script>

<div class="flex flex-col gap-1" aria-label="Checklist for {task.title}">
  {#if progress.total > 0}<p class="text-xs text-muted-foreground">
      {progress.done} of {progress.total} done
    </p>{/if}
  <AsyncView resource={items}>
    {#snippet children(list)}
      <ul class="flex flex-col gap-1">
        {#each list as item (item.id)}
          <li class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              id="item-{item.id}"
              checked={item.done}
              onchange={(event) => toggle(item.id, event.currentTarget.checked)}
            />
            <label
              for="item-{item.id}"
              class={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</label
            >
            <DeleteButton
              label="Remove {item.label}"
              what="this checklist item"
              onConfirm={() => remove(item.id)}
            />
          </li>
        {/each}
      </ul>
    {/snippet}
  </AsyncView>
  <form class="flex gap-1" onsubmit={add}>
    <Input
      class="h-7 text-xs"
      aria-label="New checklist item"
      placeholder="Add an item"
      maxlength={LABEL_MAX}
      bind:value={label}
    />
  </form>
  {#if error}<p class="text-xs text-destructive" role="alert">{error}</p>{/if}
</div>
