<script lang="ts">
  import type { Snippet } from "svelte"
  import type { SummaryTitle } from "../domain/types"
  import Poster from "./Poster.svelte"

  interface Props {
    title: SummaryTitle
    /** Under the text, e.g. the title's list as a badge. */
    children?: Snippet
  }

  let { title, children }: Props = $props()
</script>

<!-- Figma Title summary (S05, S09, S10): the poster, the name and one line, in a bordered tile. -->
<div class="flex items-center gap-inset rounded-lg border border-border p-item">
  <Poster path={title.posterPath} title={title.title} class="h-18 w-12 shrink-0 rounded-sm" />
  <div class="flex min-w-0 flex-col gap-hairline">
    <p class="truncate type-label text-foreground">{title.title}</p>
    {#if title.meta}<p class="type-sm text-muted-foreground">{title.meta}</p>{/if}
    {@render children?.()}
  </div>
</div>
