<script lang="ts">
  import { Poster } from "@/features/catalog"
  import type { MemberRef } from "@/shared/domain"
  import { statusLabel } from "../domain/labels"
  import type { WatchItem } from "../domain/types"
  import WhoIsWhere from "./WhoIsWhere.svelte"

  interface Props {
    item: WatchItem
    href: string
    /** Names for who is where; without them the card shows only your own status. */
    names?: readonly MemberRef[]
    me?: string
  }

  let { item, href, names = [], me }: Props = $props()
  const meta = $derived(
    [item.myStatus !== "not_started" && statusLabel(item.myStatus), item.releaseYear].filter(
      Boolean,
    ),
  )
</script>

<!-- Figma Watch title card (211:4823): the poster fills the top; the whole card opens the title. -->
<a
  {href}
  class="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/30"
>
  <Poster
    path={item.posterPath}
    title={item.title}
    size="w342"
    class="aspect-2/3 h-auto w-full rounded-none object-cover"
  />
  <span class="flex flex-1 flex-col gap-related p-card">
    <span class="line-clamp-2 type-h3 text-foreground">{item.title}</span>
    {#if meta.length}<span class="type-xs text-muted-foreground">{meta.join(" · ")}</span>{/if}
    {#if item.synopsis}<span class="line-clamp-2 type-sm text-muted-foreground"
        >{item.synopsis}</span
      >{/if}
    <WhoIsWhere {item} {names} {me} />
  </span>
</a>
