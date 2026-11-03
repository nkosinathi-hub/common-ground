<script lang="ts">
  import { onDestroy, untrack, type Snippet } from "svelte"
  import { Clapperboard, LoaderCircle, RefreshCw } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { type PickStatus } from "../domain/rules"
  import type { CatalogTitle } from "../domain/types"
  import { useCatalog } from "./context"
  import Pagination from "./Pagination.svelte"
  import SearchResults from "./SearchResults.svelte"
  import { SearchState } from "./search-state.svelte"

  interface Props {
    onOpen?: () => void
    spaceId: string
    onPick: (title: CatalogTitle) => void
    /** Beside the query, e.g. the list new titles go to. */
    beside?: Snippet
    /** Marks results the caller has added (or is adding), so the search can stay as it is. */
    statusOf?: (title: CatalogTitle) => PickStatus
    /** A caller-owned query lets a collection and the catalog share one search field. */
    query: string
    hrefOf?: (title: CatalogTitle) => string | undefined
  }

  let { spaceId, onPick, beside, statusOf, query, hrefOf, onOpen }: Props = $props()

  const search = new SearchState(useCatalog().service, () => spaceId)
  $effect(() => {
    const value = query
    untrack(() => search.input(value))
  })
  onDestroy(() => search.dispose())
</script>

<!-- Figma S03 search: the query beside the caller's "Add to", then results as rows. -->
<section class="flex flex-col gap-stack" aria-label="Catalog search">
  <div class="flex flex-col gap-stack sm:flex-row sm:items-end">
    {@render beside?.()}
  </div>

  {#if search.error}
    <div role="alert" class="rounded-md bg-destructive/10 p-inset type-sm text-destructive">
      <p>{search.error.message}</p>
      <Button variant="ghost" size="sm" class="mt-related px-0" onclick={() => search.retry()}>
        <RefreshCw aria-hidden="true" />Try again
      </Button>
    </div>
  {/if}

  <div aria-live="polite" aria-busy={search.loading}>
    {#if search.loading}
      <p
        class="flex items-center justify-center gap-related py-section type-sm text-muted-foreground"
      >
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />Looking for a good story
      </p>
    {:else if search.result}
      <SearchResults page={search.result} {onPick} {statusOf} {hrefOf} {onOpen} />
    {:else if !search.error}
      <p class="py-section text-center type-sm text-muted-foreground">
        <Clapperboard
          class="mx-auto mb-related size-8 text-primary"
          strokeWidth={1.3}
          aria-hidden="true"
        />
        Type at least two characters to explore the catalog.
      </p>
    {/if}
  </div>

  {#if search.result && search.result.totalPages > 1}
    <Pagination
      page={search.page}
      totalPages={search.result.totalPages}
      disabled={search.loading}
      onPage={(page) => search.goTo(page)}
    />
  {/if}
</section>
