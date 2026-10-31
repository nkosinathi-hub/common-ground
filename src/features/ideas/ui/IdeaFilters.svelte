<script lang="ts">
  import { Search } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { NativeSelect } from "$lib/components/ui/native-select"
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { IDEA_STAGES, type IdeaFilter, type Whose } from "../domain"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    filter: IdeaFilter
    tags: readonly string[]
    view: "list" | "board"
    onview: (view: "list" | "board") => void
  }

  let { filter = $bindable(), tags, view, onview }: Props = $props()
  const active = $derived(Boolean(filter.text || filter.tag || filter.stage || filter.whose))
  import { ViewToggle } from "@/shared/ui"
</script>

<!-- Figma Idea toolbar (211:10826): search, tags, stage, whose, Clear, then List or Board. -->
<div class="flex flex-wrap items-center gap-related" role="search" aria-label="Filter ideas">
  <label class="relative w-full sm:w-70">
    <span class="sr-only">Search ideas</span>
    <Search
      class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <Input
      class="pl-9"
      placeholder="Search ideas"
      value={filter.text ?? ""}
      oninput={(event) => (filter = { ...filter, text: event.currentTarget.value })}
    />
  </label>
  <NativeSelect
    aria-label="Tag"
    value={filter.tag ?? ""}
    onchange={(event) => (filter = { ...filter, tag: event.currentTarget.value || undefined })}
  >
    <option value="">Tags</option>
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
    <option value="">Stage</option>
    {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option>{/each}
  </NativeSelect>
  <ToggleGroup.Root
    type="single"
    variant="segment"
    spacing={1}
    aria-label="Whose"
    class="w-fit!"
    value={filter.whose ?? "all"}
    onValueChange={(value) =>
      value && (filter = { ...filter, whose: value === "all" ? undefined : (value as Whose) })}
  >
    <ToggleGroup.Item value="all">All</ToggleGroup.Item>
    <ToggleGroup.Item value="mine">Mine</ToggleGroup.Item>
    <ToggleGroup.Item value="ours">Ours</ToggleGroup.Item>
  </ToggleGroup.Root>
  {#if active}<Button variant="ghost" onclick={() => (filter = {})}>Clear</Button>{/if}
  <ViewToggle
    class="sm:ml-auto"
    value={view}
    options={[
      { value: "list", label: "List" },
      { value: "board", label: "Board" },
    ]}
    onchange={onview}
  />
</div>
