<script lang="ts">
  import { untrack } from "svelte"
  import { catalogKey, type CatalogTitle } from "@/features/catalog"
  import type { Result } from "@/shared/domain"
  import { SectionHeader, toast } from "@/shared/ui"
  import type { SharedIntent, WatchItem } from "../domain/types"
  import { AddTitleState } from "./add-title-state.svelte"
  import CatalogPanel from "./CatalogPanel.svelte"
  import { useWatch } from "./context"
  import { watchChanged } from "./changed"

  interface Props {
    onOpen?: () => void
    spaceId: string
    query: string
    items: readonly Pick<WatchItem, "id" | "catalog">[]
    compact?: boolean
    itemHref: (id: string) => string
    defaultIntent?: SharedIntent
    onAdded: () => void
  }

  let {
    spaceId,
    query,
    items,
    itemHref,
    defaultIntent = "want_to_watch",
    onAdded,
    compact = false,
    onOpen,
  }: Props = $props()
  let intent = $state<SharedIntent>(untrack(() => defaultIntent))
  const adds = new AddTitleState(
    useWatch().service,
    () => spaceId,
    () => intent,
  )
  const saved = $derived(
    new Map(
      items.flatMap((item) => (item.catalog ? [[catalogKey(item.catalog), item.id] as const] : [])),
    ),
  )
  const hrefOf = (title: CatalogTitle) => {
    const id = saved.get(catalogKey(title)) ?? adds.idOf(title)
    return id ? itemHref(id) : undefined
  }
  function added(result: Result<string> | null) {
    if (!result) return
    if (!result.ok) {
      if (result.error.kind === "conflict") toast(result.error.message)
      else toast.error(result.error.message)
      return
    }
    onAdded()
    watchChanged(spaceId)
    toast.success("Added to your space")
  }
</script>

<section class="flex flex-col gap-stack" aria-label="Discover titles">
  <div>
    {#if compact}<p class="type-label">From the catalog</p>{:else}<SectionHeader
        title="From the catalog"
      />{/if}
    <p class="type-sm text-muted-foreground">Find a new story or open one already in your space.</p>
  </div>
  <CatalogPanel {spaceId} {adds} bind:intent {query} {hrefOf} {onOpen} onresult={added} />
</section>
