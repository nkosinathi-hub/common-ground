<script lang="ts">
  import type { Snippet } from "svelte"
  import { Badge } from "$lib/components/ui/badge"

  interface Props {
    title: string
    /** The title links here; or pass onopen when the card opens a dialog instead. */
    href?: string
    onopen?: () => void
    description?: string
    tags?: readonly string[]
    /** Avatar and meta (due date, checklist count) along the bottom. */
    footer?: Snippet
    /** The card's menu, usually MoveMenu. */
    menu?: Snippet
  }

  let { title, href, onopen, description, tags = [], footer, menu }: Props = $props()
  const opener =
    "min-w-0 flex-1 text-left type-label text-foreground outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-3 focus-visible:after:ring-ring/20"
</script>

<!-- Figma Board card (208:7726): the title links to the item, the whole card drags. -->
<article class="relative flex flex-col gap-related rounded-md border border-border bg-card p-inset">
  <div class="flex items-start gap-related">
    {#if href}<a {href} class={opener}>{title}</a>
    {:else}<button type="button" class={opener} onclick={onopen}>{title}</button>{/if}
    {#if menu}<div class="relative z-10 -mt-1 -mr-2">{@render menu()}</div>{/if}
  </div>
  {#if description}<p class="line-clamp-2 type-xs text-muted-foreground">{description}</p>{/if}
  {#if tags.length}
    <div class="flex flex-wrap gap-hairline">
      {#each tags as tag (tag)}<Badge variant="outline">{tag}</Badge>{/each}
    </div>
  {/if}
  {#if footer}<div class="flex items-center gap-related">{@render footer()}</div>{/if}
</article>
