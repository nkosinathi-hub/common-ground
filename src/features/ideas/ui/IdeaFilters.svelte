<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Input } from "$lib/components/ui/input"
  import { IDEA_STAGES, type IdeaFilter, type Whose } from "../domain"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    filter: IdeaFilter
    tags: readonly string[]
  }

  let { filter = $bindable(), tags }: Props = $props()
</script>

<div class="flex flex-wrap gap-2" role="search" aria-label="Filter ideas">
  <Input
    class="max-w-56"
    placeholder="Search ideas"
    aria-label="Search ideas"
    value={filter.text ?? ""}
    oninput={(event) => (filter = { ...filter, text: event.currentTarget.value })}
  />
  <NativeSelect
    aria-label="Tag"
    value={filter.tag ?? ""}
    onchange={(event) => (filter = { ...filter, tag: event.currentTarget.value || undefined })}
  >
    <option value="">All tags</option>
    {#each tags as tag (tag)}<option value={tag}>{tag}</option>{/each}
  </NativeSelect>
  <NativeSelect
    aria-label="Stage"
    value={filter.stage ?? ""}
    onchange={(event) =>
      (filter = {
        ...filter,
        stage: (event.currentTarget.value || undefined) as IdeaFilter["stage"],
      })}
  >
    <option value="">All stages</option>
    {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option>{/each}
  </NativeSelect>
  <NativeSelect
    aria-label="Whose"
    value={filter.whose ?? ""}
    onchange={(event) =>
      (filter = { ...filter, whose: (event.currentTarget.value || undefined) as Whose })}
  >
    <option value="">All</option>
    <option value="mine">Mine</option>
    <option value="ours">Ours</option>
  </NativeSelect>
</div>
