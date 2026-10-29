<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "$lib/utils"
  import AccountMenu from "./AccountMenu.svelte"
  import { SECTIONS, sectionHref, type Section } from "./nav"
  import SpaceSwitcher from "./SpaceSwitcher.svelte"

  interface Props {
    spaceId: string
    current: Section | null
    onSignOut: () => void
    /** The bell, beside the account avatar. */
    bell?: Snippet
    /** Rendered between the bars: the page. */
    children: Snippet
  }

  let { spaceId, current, onSignOut, bell, children }: Props = $props()
</script>

<!-- Figma Mobile app bar (200:2546) above the page and Mobile tab bar (200:2748) below it. -->
<header class="flex h-14 items-center gap-related px-gutter md:hidden">
  <div class="min-w-0 flex-1"><SpaceSwitcher variant="bar" /></div>
  {@render bell?.()}
  <AccountMenu variant="bar" {onSignOut} />
</header>
{@render children()}
<nav
  aria-label="Main"
  class="fixed inset-x-0 bottom-0 z-40 grid auto-cols-fr grid-flow-col border-t border-border bg-card px-related pt-related pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
>
  {#each SECTIONS as section (section.id)}
    {@const active = current === section.id}
    <a
      href={sectionHref(spaceId, section.id)}
      aria-current={active ? "page" : undefined}
      class="group flex flex-col items-center gap-hairline outline-none"
    >
      <span
        class={cn(
          "flex h-8 w-14 items-center justify-center rounded-full group-focus-visible:ring-3 group-focus-visible:ring-ring/20",
          active ? "bg-secondary text-primary" : "text-muted-foreground",
        )}
      >
        <section.icon class="size-6" aria-hidden="true" />
      </span>
      <span class={cn("type-label-sm", active ? "text-primary" : "text-muted-foreground")}
        >{section.label}</span
      >
    </a>
  {/each}
</nav>
