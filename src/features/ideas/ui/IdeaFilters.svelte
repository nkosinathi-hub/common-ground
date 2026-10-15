<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { IDEA_STAGES, type IdeaFilter } from "../domain"
  import { STAGE_LABELS } from "./labels"

  let { filter = $bindable(), tags }: { filter: IdeaFilter; tags: readonly string[] } = $props()
  const select = "border-input bg-background h-8 rounded-lg border px-2 text-sm"
</script>

<div class="flex flex-wrap gap-2" role="search" aria-label="Filter ideas">
  <Input
    class="max-w-56"
    placeholder="Search ideas"
    aria-label="Search ideas"
    value={filter.text ?? ""}
    oninput={(e) => (filter = { ...filter, text: e.currentTarget.value })}
  />
  <select
    class={select}
    aria-label="Tag"
    value={filter.tag ?? ""}
    onchange={(e) => (filter = { ...filter, tag: e.currentTarget.value || undefined })}
  >
    <option value="">All tags</option>
    {#each tags as tag (tag)}<option value={tag}>{tag}</option>{/each}
  </select>
  <select
    class={select}
    aria-label="Stage"
    value={filter.stage ?? ""}
    onchange={(e) =>
      (filter = { ...filter, stage: (e.currentTarget.value || undefined) as IdeaFilter["stage"] })}
  >
    <option value="">All stages</option>
    {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option>{/each}
  </select>
</div>
