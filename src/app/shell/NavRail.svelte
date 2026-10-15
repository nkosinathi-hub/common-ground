<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "$lib/utils"
  import { SECTIONS, sectionHref, type Section } from "./nav"

  let {
    spaceId,
    current,
    top,
    bottom,
  }: {
    spaceId: string
    current: Section | null
    top: Snippet
    bottom: Snippet
  } = $props()
</script>

<aside
  class="hidden w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 md:flex"
>
  {@render top()}
  <nav aria-label="Main" class="flex flex-col gap-1">
    {#each SECTIONS as section (section.id)}
      <a
        href={sectionHref(spaceId, section.id)}
        aria-current={current === section.id ? "page" : undefined}
        class={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          current === section.id ? "bg-sidebar-accent text-primary" : "hover:bg-sidebar-accent/60",
        )}
      >
        <section.icon class="size-4" aria-hidden="true" />{section.label}
      </a>
    {/each}
  </nav>
  <div class="mt-auto">{@render bottom()}</div>
</aside>
