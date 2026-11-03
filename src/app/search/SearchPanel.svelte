<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import type { Space } from "@/features/spaces"
  import { WatchCatalog } from "@/features/watch"
  import type { SearchState } from "@/features/search"
  import { buildHash } from "@/shared/domain"
  import WorkspaceMatches from "./WorkspaceMatches.svelte"
  let {
    space,
    search,
    onOpen,
    onManual,
  }: {
    space: Space
    search: SearchState
    onOpen: () => void
    onManual: () => void
  } = $props()
  const saved = $derived(
    search.hits
      .filter((hit) => hit.kind === "watch" && hit.catalog)
      .map((hit) => ({ id: hit.id, catalog: hit.catalog! })),
  )
</script>

<div
  data-search-results
  role="region"
  aria-label="Search results"
  class="fixed top-[calc(var(--chrome-top)+5rem)] right-gutter left-gutter z-50 flex max-h-[min(65dvh,44rem)] flex-col gap-stack overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-inset shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 sm:absolute sm:top-[calc(100%+0.5rem)] sm:right-0 sm:left-auto sm:w-full"
>
  <p class="type-xs text-muted-foreground">
    Searching {space.name} · Titles, ideas, notes, plans and discussions
  </p>
  {#if search.query.trim().length >= 2}
    <WorkspaceMatches {search} {onOpen} />
    <WatchCatalog
      spaceId={space.id}
      query={search.query}
      items={saved}
      compact
      {onOpen}
      defaultIntent={space.defaultWatchIntent}
      onAdded={() => void search.load()}
      itemHref={(itemId) => buildHash({ name: "watch-item", spaceId: space.id, itemId })}
    />
  {:else}
    <p class="type-sm text-muted-foreground">
      Type at least two characters to search everything in this space and the title catalog.
    </p>
    <p class="type-xs text-muted-foreground">
      Use ↑ ↓ to browse results, Enter to open, and Esc to close.
    </p>
  {/if}
  <div class="border-t border-border pt-related">
    <Button variant="ghost" size="sm" onclick={onManual}>Enter a title manually</Button>
  </div>
</div>
