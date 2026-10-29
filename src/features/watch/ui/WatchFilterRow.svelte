<script lang="ts">
  import { INTENTS, STATUSES } from "../domain/labels"
  import type { WatchSort } from "../domain/types"
  import Choice from "./Choice.svelte"
  import type { WatchListState } from "./watch-list-state.svelte"

  const SORTS: readonly { value: WatchSort; label: string }[] = [
    { value: "recent", label: "Recently added" },
    { value: "title", label: "Title A to Z" },
  ]

  /** Lists, progress and sort: one line, swiped on phones. */
  let { list }: { list: WatchListState } = $props()
</script>

<div
  class="flex items-center gap-related *:shrink-0 max-lg:overflow-x-auto max-lg:contain-paint lg:col-start-2 lg:row-start-2"
>
  <Choice
    id="watch-intent"
    label="List"
    hideLabel
    value={list.filters.intent ?? ""}
    options={INTENTS}
    anyLabel="All lists"
    onchange={(value) => list.setFilter({ intent: value || null })}
  />
  <Choice
    id="watch-my-status"
    label="My progress"
    hideLabel
    value={list.filters.myStatus ?? ""}
    options={STATUSES}
    anyLabel="Any progress"
    onchange={(value) => list.setFilter({ myStatus: value || null })}
  />
  <span class="flex shrink-0 items-center gap-related lg:ml-auto">
    <span class="type-sm text-muted-foreground max-lg:hidden" aria-hidden="true">Sort</span>
    <Choice
      id="watch-sort"
      label="Sort"
      hideLabel
      value={list.filters.sort}
      options={SORTS}
      onchange={(value) => list.setFilter({ sort: value || "recent" })}
    />
  </span>
</div>
