<script lang="ts">
  import { ArrowRight, CircleCheck, Flag, Square } from "@lucide/svelte"
  import { buildHash } from "@/shared/domain"
  import { TextLink } from "@/shared/ui"
  import type { DayItem } from "../domain"
  import { KINDS, type Who } from "./kinds"
  import { entryHref } from "./links"

  const PRIORITY: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  }

  interface Props {
    item: DayItem
    spaceId: string
    who: Who
  }

  let { item, spaceId, who }: Props = $props()
  const entry = $derived(item.entry)
  const done = $derived(entry.status === "done")
  const Icon = $derived(done ? CircleCheck : entry.kind === "milestone" ? Flag : Square)
  const meta = $derived(
    [who(entry.people), entry.priority && PRIORITY[entry.priority], entry.milestone]
      .filter(Boolean)
      .join(" · "),
  )
</script>

<!-- Figma Due row (D12 "Due today"): the task or milestone opens its idea tab; its idea is a link. -->
<div class="relative flex items-start gap-item py-related" data-testid="calendar-entry">
  <Icon
    class="mt-0.5 size-4 shrink-0 {done ? 'text-primary' : 'text-muted-foreground'}"
    aria-hidden="true"
  />
  <div class="flex min-w-0 flex-1 flex-col gap-hairline">
    <a
      href={entryHref(spaceId, entry)}
      class="type-label text-foreground outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-3 focus-visible:after:ring-ring/30"
      class:line-through={done}
      ><span class="sr-only">{KINDS[entry.kind].label}:</span> {entry.title}</a
    >
    {#if meta}<span class="type-xs text-muted-foreground">{meta}</span>{/if}
    {#if entry.ideaTitle && entry.ideaId}
      <TextLink
        href={buildHash({ name: "idea", spaceId, ideaId: entry.ideaId, tab: "overview" })}
        icon={ArrowRight}
        class="relative z-10 w-fit type-label">{entry.ideaTitle}</TextLink
      >
    {/if}
  </div>
</div>
