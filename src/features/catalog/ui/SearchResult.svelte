<script lang="ts">
  import { ArrowRight, Check, LoaderCircle, Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { type PickStatus } from "../domain/rules"
  import type { CatalogTitle } from "../domain/types"
  import Poster from "./Poster.svelte"

  interface Props {
    onOpen?: () => void
    item: CatalogTitle
    onPick: (title: CatalogTitle) => void
    status?: PickStatus
    href?: string
  }

  let { item, onPick, status = "idle", href, onOpen }: Props = $props()
</script>

<!-- Figma S03 result row: poster, title, year and story, then Add or the added tick. -->
<article class="flex flex-wrap items-center gap-item px-inset py-item sm:flex-nowrap">
  <Poster path={item.posterPath} title={item.title} class="h-15 w-10 shrink-0 rounded-sm" />
  <div class="flex min-w-0 flex-1 flex-col">
    <p class="type-label text-foreground">{item.title}</p>
    {#if item.year}<p class="type-sm text-muted-foreground">{item.year}</p>{/if}
    <p class="line-clamp-2 type-sm text-foreground">
      {item.synopsis || "A story waiting to be discovered."}
    </p>
  </div>
  {#if href}
    <Button variant="outline" size="sm" {href} onclick={onOpen} aria-label={`Open ${item.title}`}>
      Open<ArrowRight aria-hidden="true" />
    </Button>
  {:else if status === "added"}
    <p class="flex shrink-0 items-center gap-related type-label-sm text-foreground">
      <Check aria-hidden="true" class="size-4 text-primary" />Added to your space
    </p>
  {:else}
    <Button
      variant="outline"
      size="sm"
      class="shrink-0"
      aria-label={`Add ${item.title}`}
      disabled={status === "adding"}
      onclick={() => onPick(item)}
    >
      {#if status === "adding"}<LoaderCircle aria-hidden="true" class="animate-spin" />Adding
      {:else}<Plus aria-hidden="true" />Add{/if}
    </Button>
  {/if}
</article>
