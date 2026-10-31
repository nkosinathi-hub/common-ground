<script lang="ts">
  import { untrack } from "svelte"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import type { Result } from "@/shared/domain"
  import { AsyncView, DeleteButton, FormError, Resource } from "@/shared/ui"
  import { checklistProgress, type ChecklistItem, type Task } from "../domain"
  import ChecklistAdd from "./ChecklistAdd.svelte"
  import { useTasks } from "./context"

  type Change<T> = (value: T, items: ChecklistItem[]) => ChecklistItem[]

  interface Props {
    task: Task
    canDelete: (createdBy: string | null) => boolean
  }

  let { task, canDelete }: Props = $props()
  const { checklist } = useTasks()
  const items = new Resource<ChecklistItem[]>(() => checklist.list(untrack(() => task.id)))
  let error = $state<string | null>(null)
  // Reloads when the card shows another task.
  $effect(() => {
    void task.id
    void items.load()
  })
  const current = () => items.value ?? []
  const progress = $derived(checklistProgress(items.value ?? []))

  async function run<T>(write: Promise<Result<T>>, change: Change<T>): Promise<boolean> {
    const failure = await items.apply(write, (value, list) => change(value, list ?? []))
    error = failure?.message ?? null
    return !failure
  }

  const add = (label: string) =>
    run(checklist.add(task, label, current()), (item, list) => [...list, item])

  const toggle = (id: string, done: boolean) =>
    run(checklist.toggle(id, done), (item, list) =>
      list.map((entry) => (entry.id === id ? item : entry)),
    )
  const remove = (id: string) =>
    run(checklist.remove(id), (_removed, list) => list.filter((entry) => entry.id !== id))
</script>

<!-- D08 checklist: a quiet panel inside the task card, ticked in place. -->
<section
  class="flex flex-col gap-related rounded-md bg-muted p-inset"
  aria-label="Checklist for {task.title}"
>
  <p class="flex items-baseline gap-related">
    <span class="type-label text-foreground">Checklist</span>
    <span class="type-xs text-muted-foreground">{progress.done} of {progress.total}</span>
  </p>
  <AsyncView resource={items}>
    {#snippet children(list)}
      <ul class="flex flex-col gap-related">
        {#each list as item (item.id)}
          <li class="flex min-h-8 items-center gap-item">
            <Checkbox
              id="item-{item.id}"
              checked={item.done}
              onCheckedChange={(done) => toggle(item.id, done === true)}
            />
            <Label
              for="item-{item.id}"
              class="flex-1 {item.done ? 'text-muted-foreground line-through' : ''}"
              >{item.label}</Label
            >
            {#if canDelete(item.createdBy)}
              <DeleteButton
                label="Remove {item.label}"
                what="this checklist item"
                onConfirm={() => remove(item.id)}
              />
            {/if}
          </li>
        {/each}
      </ul>
    {/snippet}
  </AsyncView>
  <ChecklistAdd onadd={add} />
  <FormError message={error} />
</section>
