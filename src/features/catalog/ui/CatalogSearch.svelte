<script lang="ts">
  import { onDestroy, type Snippet } from "svelte"
  import { Clapperboard, LoaderCircle, RefreshCw, Search } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { FormField } from "@/shared/ui"
  import { QUERY_MAX, type PickStatus } from "../domain/rules"
  import type { CatalogTitle } from "../domain/types"
  import { useCatalog } from "./context"
  import Pagination from "./Pagination.svelte"
  import SearchResults from "./SearchResults.svelte"
  import { SearchState } from "./search-state.svelte"

  interface Props {
    spaceId: string
    onPick: (title: CatalogTitle) => void
    /** Beside the query, e.g. the list new titles go to. */
    beside?: Snippet
    /** Marks results the caller has added (or is adding), so the search can stay as it is. */
    statusOf?: (title: CatalogTitle) => PickStatus
  }

  let { spaceId, onPick, beside, statusOf }: Props = $props()

  const search = new SearchState(useCatalog().service, () => spaceId)
  onDestroy(() => search.dispose())
</script>

<!-- Figma S03 search: the query beside the caller's "Add to", then results as rows. -->
<section class="flex flex-col gap-stack" aria-label="Catalog search">
  <div class="flex flex-col gap-stack sm:flex-row sm:items-end">
    <div class="min-w-0 flex-1">
      <FormField id="catalog-query" label="Search titles">
        {#snippet control({ id })}
          <span class="relative block">
            <Search
              class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              {id}
              type="search"
              class="pl-9"
              maxlength={QUERY_MAX}
              placeholder="Search movies, series and anime…"
              value={search.query}
              oninput={(event) => search.input(event.currentTarget.value)}
            />
          </span>
        {/snippet}
      </FormField>
    </div>
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
      <SearchResults page={search.result} {onPick} {statusOf} />
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
