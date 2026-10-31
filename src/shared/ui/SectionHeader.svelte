<script lang="ts">
  import { ArrowRight } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import TextLink from "./TextLink.svelte"

  interface Props {
    title: string
    /** The heading level for the outline; it always looks like heading/h3. */
    level?: 2 | 3
    id?: string
    /** Adds "See all" linking to the full list. */
    seeAll?: string
    seeAllLabel?: string
    actions?: Snippet
  }

  let { title, level = 2, id, seeAll, seeAllLabel = "See all", actions }: Props = $props()
</script>

<div class="flex min-h-11 items-center gap-item">
  <svelte:element this={`h${level}`} {id} class="min-w-0 flex-1 truncate type-h3">
    {title}
  </svelte:element>
  {@render actions?.()}
  {#if seeAll}<TextLink href={seeAll} icon={ArrowRight}>{seeAllLabel}</TextLink>{/if}
</div>
