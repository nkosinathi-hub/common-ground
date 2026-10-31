<script lang="ts">
  import { Poster } from "@/features/catalog"
  import type { MemberRef } from "@/shared/domain"
  import type { WatchItem } from "../domain/types"
  import WhoIsWhere from "./WhoIsWhere.svelte"

  interface Props {
    item: WatchItem
    href: string
    names: readonly MemberRef[]
    me?: string
  }

  let { item, href, names, me }: Props = $props()
</script>

<!-- A landscape card: the whole card opens the title, so it carries no extra link. -->
<a
  {href}
  class="flex h-full gap-item rounded-lg border border-border bg-card p-item transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/30"
>
  <Poster
    path={item.posterPath}
    title={item.title}
    size="w342"
    class="aspect-2/3 h-auto w-20 shrink-0 self-start rounded-md object-cover sm:w-24"
  />
  <span class="flex min-w-0 flex-1 flex-col gap-related">
    <span class="line-clamp-2 type-label text-foreground">{item.title}</span>
    <WhoIsWhere {item} {names} {me} />
  </span>
</a>
