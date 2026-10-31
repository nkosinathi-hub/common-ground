<script lang="ts">
  import { untrack } from "svelte"
  import { Search, X } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { ViewToggle } from "@/shared/ui"
  import type { LinkOption } from "../application/ports"
  import type { LinkKind } from "../domain"
  import { useCalendar } from "./context"

  const KINDS: { value: LinkKind; label: string }[] = [
    { value: "watch_item", label: "Watch" },
    { value: "idea", label: "Idea" },
    { value: "task", label: "Task" },
  ]
  // The space before "(optional)" survives only inside an expression.
  const LEGEND = "Link to something "
  const PLACEHOLDER = { watch_item: "your Watch library", idea: "your ideas", task: "your tasks" }

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
  // Searches again whenever the kind or the text changes; only the newest answer is shown.
  $effect(() => {
    const [k, q] = [kind, query]
    untrack(() => void search(k, q))
  })
</script>

<!-- S06c "Link to something": the kind as a segmented choice, then search it. -->
<fieldset class="flex flex-col gap-related">
  <legend class="mb-related type-label text-foreground">
    {LEGEND}<span class="font-normal text-muted-foreground">(optional)</span>
  </legend>
  {#if value}
    <div
      class="flex items-center justify-between gap-related rounded-md border border-border p-related type-sm"
    >
      <span>Linked to <strong>{value.label}</strong></span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Remove link"
        onclick={() => (value = null)}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  {:else}
    <ViewToggle
      label="Link type"
      class="w-full! [&>*]:flex-1"
      value={kind}
      options={KINDS}
      onchange={(next) => (kind = next)}
    />
    <div class="relative">
      <Search
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        class="pl-9"
        aria-label="Search to link"
        placeholder="Search {PLACEHOLDER[kind]}…"
        bind:value={query}
      />
    </div>
    {#if query.trim() || results.length}
      <ul class="flex max-h-40 flex-col overflow-y-auto" aria-label="Matches">
        {#each results as option (option.id)}
          <li>
            <button
              type="button"
              class="w-full truncate rounded-md p-related text-left type-sm hover:bg-muted"
              onclick={() => (value = option)}>{option.label}</button
            >
          </li>
        {:else}
          <li class="p-related type-sm text-muted-foreground">No matches</li>
        {/each}
      </ul>
    {/if}
  {/if}
</fieldset>
