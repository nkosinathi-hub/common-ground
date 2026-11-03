<script lang="ts">
  import { INTENTS, MEDIA_TYPES, STATUSES } from "../domain/labels"
  import type { MediaType, WatchFilters } from "../domain/types"
  import Choice from "./Choice.svelte"
  import { SORTS } from "./watch-filter-options"
  let {
    draft = $bindable(),
    counts,
  }: {
    draft: WatchFilters
    counts: Record<MediaType, number> | null
  } = $props()
  const media = $derived(
    MEDIA_TYPES.map((type) => ({
      ...type,
      label: counts ? `${type.label} (${counts[type.value]})` : type.label,
    })),
  )
  const id = $props.id()
</script>

<div class="grid gap-stack sm:grid-cols-2">
  <Choice
    id={`${id}-type`}
    label="Type"
    value={draft.mediaType ?? ""}
    options={media}
    anyLabel="All types"
    class="w-full"
    onchange={(value) => (draft = { ...draft, mediaType: value || null })}
  />
  <Choice
    id={`${id}-list`}
    label="List"
    value={draft.intent ?? ""}
    options={INTENTS}
    anyLabel="All lists"
    class="w-full"
    onchange={(value) => (draft = { ...draft, intent: value || null })}
  />
  <Choice
    id={`${id}-progress`}
    label="My progress"
    value={draft.myStatus ?? ""}
    options={STATUSES}
    anyLabel="Any progress"
    class="w-full"
    onchange={(value) => (draft = { ...draft, myStatus: value || null })}
  />
  <Choice
    id={`${id}-sort`}
    label="Sort"
    value={draft.sort}
    options={SORTS}
    class="w-full"
    onchange={(value) => (draft = { ...draft, sort: value || "recent" })}
  />
</div>
