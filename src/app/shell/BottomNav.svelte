<script lang="ts">
  import { cn } from "$lib/utils"
  import { SECTIONS, sectionHref, type Section } from "./nav"

  let { spaceId, current }: { spaceId: string; current: Section | null } = $props()
</script>

<nav
  aria-label="Main"
  class="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
>
  {#each SECTIONS as section (section.id)}
    <a
      href={sectionHref(spaceId, section.id)}
      aria-current={current === section.id ? "page" : undefined}
      class={cn(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium",
        current === section.id ? "text-primary" : "text-muted-foreground",
      )}
    >
      <section.icon class="size-5" aria-hidden="true" />{section.label}
    </a>
  {/each}
</nav>
