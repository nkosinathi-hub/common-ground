<script lang="ts">
  import type { CatalogTitle, SearchPage } from "../domain/types"
  import SearchResult from "./SearchResult.svelte"

  interface Props {
    page: SearchPage
    onPick: (title: CatalogTitle) => void
  }

  let { page, onPick }: Props = $props()
</script>

{#if page.stale}
  <p class="text-xs text-muted-foreground">Saved results: the catalog could not be reached.</p>
{/if}
{#if page.results.length > 0}
  <ul class="divide-y">
    {#each page.results as item (`${item.type}-${item.id}`)}
      <li><SearchResult {item} {onPick} /></li>
    {/each}
  </ul>
{:else}
  <p class="py-10 text-center text-sm text-muted-foreground">No titles found on this page.</p>
{/if}
