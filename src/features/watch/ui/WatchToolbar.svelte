<script lang="ts">
  import { ArrowDownUp, Search } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { SEARCH_MAX } from "../domain/filters"
  import { INTENTS, MEDIA_TYPES, STATUSES } from "../domain/labels"
  import type { WatchSort } from "../domain/types"
  import Choice from "./Choice.svelte"
  import type { WatchListState } from "./watch-list.svelte"

  const CHIPS = [{ value: null, label: "All titles" }, ...MEDIA_TYPES]
  const SORTS: readonly { value: WatchSort; label: string }[] = [
    { value: "recent", label: "Recently added" },
    { value: "title", label: "Title A to Z" },
  ]

  interface Props {
    list: WatchListState
  }

  let { list }: Props = $props()
</script>

<div class="flex flex-col gap-4 border-b pb-5">
  <div class="flex flex-wrap gap-1" role="group" aria-label="Type">
    {#each CHIPS as chip (chip.label)}
      <Button
        variant={list.filters.mediaType === chip.value ? "secondary" : "ghost"}
        size="sm"
        aria-pressed={list.filters.mediaType === chip.value}
        onclick={() => list.setFilter({ mediaType: chip.value })}>{chip.label}</Button
      >
    {/each}
  </div>
  <div class="flex flex-wrap items-end gap-3">
    <label class="relative min-w-48 flex-1">
      <span class="sr-only">Search your titles</span>
      <Search class="absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        class="pl-8"
        maxlength={SEARCH_MAX}
        placeholder="Find a title"
        value={list.filters.search}
        oninput={(event) => list.search(event.currentTarget.value)}
      />
    </label>
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
    <div class="flex items-center gap-1">
      <ArrowDownUp class="size-4 text-muted-foreground" aria-hidden="true" />
      <Choice
        id="watch-sort"
        label="Sort"
        hideLabel
        value={list.filters.sort}
        options={SORTS}
        onchange={(value) => list.setFilter({ sort: value || "recent" })}
      />
    </div>
  </div>
</div>
