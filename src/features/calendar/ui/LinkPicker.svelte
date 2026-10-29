<script lang="ts">
  import { untrack } from "svelte"
  import { X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import * as Tabs from "$lib/components/ui/tabs"
  import type { LinkOption } from "../application/ports"
  import type { LinkKind } from "../domain"
  import { useCalendar } from "./context"

  const KINDS: { value: LinkKind; label: string }[] = [
    { value: "watch_item", label: "Watch" },
    { value: "idea", label: "Idea" },
    { value: "task", label: "Task" },
  ]

  interface Props {
    spaceId: string
    value: LinkOption | null
  }

  let { spaceId, value = $bindable(null) }: Props = $props()
  const { service } = useCalendar()
  let kind = $state<LinkKind>("watch_item")
  let query = $state("")
  let results = $state<LinkOption[]>([])
  let generation = 0

  async function search(k: LinkKind, q: string) {
    const mine = ++generation
    const found = await service.linkSearch(spaceId, k, q)
    if (mine === generation) results = found.ok ? found.value : []
  }

  // Searches again whenever the tab or the text changes; only the newest answer is shown.
  $effect(() => {
    const [k, q] = [kind, query]
    untrack(() => void search(k, q))
  })
</script>

<fieldset class="grid gap-2">
  <legend class="mb-1.5 text-sm font-medium">Link to</legend>
  {#if value}
    <div class="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
      <span>Linked to <strong>{value.label}</strong></span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Remove link"
        onclick={() => (value = null)}
      >
        <X />
      </Button>
    </div>
  {:else}
    <Tabs.Root bind:value={kind}>
      <Tabs.List aria-label="Link type">
        {#each KINDS as option (option.value)}
          <Tabs.Trigger value={option.value}>{option.label}</Tabs.Trigger>
        {/each}
      </Tabs.List>
    </Tabs.Root>
    <Input type="search" aria-label="Search to link" placeholder="Search" bind:value={query} />
    <ul class="flex max-h-40 flex-col overflow-y-auto" aria-label="Matches">
      {#each results as option (option.id)}
        <li>
          <button
            type="button"
            class="w-full truncate rounded-md p-2 text-left text-sm hover:bg-muted"
            onclick={() => (value = option)}>{option.label}</button
          >
        </li>
      {:else}
        <li class="p-2 text-sm text-muted-foreground">No matches</li>
      {/each}
    </ul>
  {/if}
</fieldset>
