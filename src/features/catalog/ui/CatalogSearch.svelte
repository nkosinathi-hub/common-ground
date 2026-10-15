<script lang="ts">
  import { onDestroy } from "svelte"
  import { Clapperboard, LoaderCircle, Plus, RefreshCw, Search } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { QUERY_MAX } from "../domain/rules"
  import type { CatalogTitle } from "../domain/types"
  import Attribution from "./Attribution.svelte"
  import { getCatalogService } from "./context"
  import Pagination from "./Pagination.svelte"
  import SearchResults from "./SearchResults.svelte"
  import { SearchState } from "./search-state.svelte"

  interface Props {
    spaceId: string
    onPick: (title: CatalogTitle) => void
    onManual: () => void
  }

  let { spaceId, onPick, onManual }: Props = $props()

  const search = new SearchState(getCatalogService(), () => spaceId)
  onDestroy(() => search.dispose())
</script>

<section class="space-y-4" aria-label="Catalog search">
  <label class="block space-y-2">
    <span class="text-xs font-medium text-muted-foreground">Search the catalog</span>
    <span class="relative block">
      <Search class="absolute top-2 left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        class="pl-8"
        maxlength={QUERY_MAX}
        placeholder="A title you have been meaning to watch"
        value={search.query}
        oninput={(event) => search.input(event.currentTarget.value)}
      />
    </span>
  </label>

  {#if search.error}
    <div role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm leading-6 text-destructive">
      <p>{search.error.message}</p>
      <Button variant="ghost" size="sm" class="mt-2 px-0" onclick={() => search.retry()}>
        <RefreshCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  {/if}

  <div aria-live="polite" aria-busy={search.loading}>
    {#if search.loading}
      <p class="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
        Looking for a good story
      </p>
    {:else if search.result}
      <SearchResults page={search.result} {onPick} />
    {:else if !search.error}
      <div class="py-10 text-center">
        <Clapperboard
          class="mx-auto mb-3 size-8 text-primary"
          strokeWidth={1.3}
          aria-hidden="true"
        />
        <p class="text-xs text-muted-foreground">
          Type at least two characters to explore the catalog.
        </p>
      </div>
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

  <Button variant="secondary" class="w-full" onclick={onManual}>
    <Plus aria-hidden="true" />
    Add a title manually instead
  </Button>
  <Attribution />
</section>
