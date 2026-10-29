<script lang="ts">
  import { Poster } from "@/features/catalog"
  import { statusLabel } from "../domain/labels"
  import type { MemberRef } from "@/shared/domain"
  import type { WatchItem } from "../domain/types"
  import PlaceBadges from "./PlaceBadges.svelte"

  interface Props {
    item: WatchItem
    href: string
    /** Names for the place badges; without them the card shows only your own status. */
    names?: readonly MemberRef[]
  }

  let { item, href, names = [] }: Props = $props()
</script>

<a
  {href}
  class="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
>
  <span class="relative block">
    <Poster
      path={item.posterPath}
      title={item.title}
      size="w342"
      class="aspect-[2/3] h-auto w-full rounded-none"
    />
  </span>
  <span class="flex flex-1 flex-col gap-1 p-3">
    <span class="line-clamp-2 text-sm font-medium">{item.title}</span>
    <span class="text-xs text-muted-foreground">
      {item.releaseYear ?? "Year unknown"}{item.myStatus !== "not_started"
        ? ` · ${statusLabel(item.myStatus)}`
        : ""}
    </span>
    <PlaceBadges {item} {names} />
  </span>
</a>
