<script lang="ts">
  import { ArrowRight } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Poster } from "@/features/catalog"
  import { intentLabel, mediaTypeLabel, statusLabel } from "../domain/labels"
  import type { WatchItem } from "../domain/types"

  interface Props {
    item: WatchItem
    href: string
  }

  let { item, href }: Props = $props()
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
    <Badge variant="secondary" class="absolute bottom-2 left-2"
      >{mediaTypeLabel(item.mediaType)}</Badge
    >
  </span>
  <span class="flex flex-1 flex-col gap-1 p-3">
    <span class="line-clamp-2 text-sm font-medium">{item.title}</span>
    <span class="text-xs text-muted-foreground">
      {item.releaseYear ?? "Year unknown"}{item.myStatus !== "not_started"
        ? ` · ${statusLabel(item.myStatus)}`
        : ""}
    </span>
    <span class="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
      {intentLabel(item.intent)}
      <ArrowRight class="size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
    </span>
  </span>
</a>
