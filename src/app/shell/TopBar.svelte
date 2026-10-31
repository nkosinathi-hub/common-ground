<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import type { Crumb } from "./breadcrumbs"

  interface Props {
    crumbs: readonly Crumb[]
    /** Capture idea and the bell. */
    actions?: Snippet
  }

  let { crumbs, actions }: Props = $props()
</script>

<!-- Figma Top bar / Desktop (185:779). -->
<!-- Sticky under the demo notice, if any (--chrome-top), so it never half-scrolls away. -->
<header
  class="sticky top-(--chrome-top) z-30 hidden h-16 items-center gap-related border-b border-border bg-background/95 px-gutter backdrop-blur md:flex"
>
  <nav aria-label="Breadcrumb" class="min-w-0 flex-1">
    <ol class="flex items-center gap-related">
      {#each crumbs as crumb, index (index)}
        <li class="flex min-w-0 items-center gap-related">
          {#if crumb.href}
            <a
              href={crumb.href}
              class="truncate type-sm text-muted-foreground hover:text-foreground">{crumb.label}</a
            >
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {:else}
            <span aria-current="page" class="truncate type-label text-foreground"
              >{crumb.label}</span
            >
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
  {@render actions?.()}
</header>
