<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import { Poster } from "@/features/catalog"
  import type { MemberRef } from "@/shared/domain"
  import { describePlaces } from "../domain/places-summary"
  import { statusLabel } from "../domain/labels"
  import type { WatchItem } from "../domain/types"

  let { item, href, names }: { item: WatchItem; href: string; names: readonly MemberRef[] } =
    $props()
  const together = $derived(describePlaces(item.places, item.together, names).together)
  const meta = $derived(
    [item.myStatus !== "not_started" && statusLabel(item.myStatus), item.releaseYear].filter(
      Boolean,
    ),
  )
</script>

<!-- M02: a list row on phones, artwork beside the words, the whole row a link. -->
<a
  {href}
  class="flex items-center gap-item py-item outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
>
  <Poster
    path={item.posterPath}
    title={item.title}
    size="w185"
    class="aspect-2/3 h-auto w-14 shrink-0 rounded-md object-cover"
  />
  <span class="flex min-w-0 flex-1 flex-col gap-hairline">
    <span class="line-clamp-2 type-label text-foreground">{item.title}</span>
    {#if meta.length}<span class="type-xs text-muted-foreground">{meta.join(" · ")}</span>{/if}
    {#if together}<span class="type-xs text-primary">Together at {together}</span>{/if}
  </span>
  <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
</a>
