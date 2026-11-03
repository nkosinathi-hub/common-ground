<script lang="ts">
  import { ArrowRight } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { SEARCH_KINDS, type SearchState } from "@/features/search"
  import { buildHash } from "@/shared/domain"
  let { search, onOpen }: { search: SearchState; onOpen: () => void } = $props()
</script>

<section aria-label="Workspace matches" class="flex flex-col gap-related">
  <p class="type-label" aria-live="polite">In your space{search.loading ? " · Searching…" : ""}</p>
  {#if search.error}
    <p role="alert" class="type-sm text-destructive">{search.error.message}</p>
    <Button variant="ghost" size="sm" onclick={() => search.load()}>Try again</Button>
  {:else if search.hits.length}
    <ul class="flex flex-col gap-hairline">
      {#each search.hits as hit (`${hit.kind}:${hit.id}`)}
        <li>
          <a
            href={buildHash(hit.route)}
            onclick={onOpen}
            data-search-hit
            class="flex min-h-11 items-center gap-item rounded-lg p-item outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate type-label-sm">{hit.title}</span>
              <span class="block type-xs text-muted-foreground">{SEARCH_KINDS[hit.kind]}</span>
              {#if hit.preview && hit.preview !== hit.title}<span
                  class="line-clamp-1 type-sm text-muted-foreground">{hit.preview}</span
                >{/if}
            </span>
            <ArrowRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </a>
        </li>
      {/each}
    </ul>
  {:else if !search.loading}<p class="type-sm text-muted-foreground">
      No saved matches. Catalog results are below.
    </p>{/if}
  {#if search.unavailable.length}
    <p role="alert" class="type-xs text-muted-foreground">
      Some results are unavailable: {search.unavailable.join(", ")}.
    </p>
    <Button variant="ghost" size="sm" onclick={() => search.load()}>Retry workspace search</Button>
  {/if}
  {#if search.more}<Button
      variant="outline"
      size="sm"
      disabled={search.loading}
      onclick={() => search.load(true)}>More workspace results</Button
    >{/if}
</section>
