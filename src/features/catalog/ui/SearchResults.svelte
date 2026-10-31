<script lang="ts">
  import { catalogKey, type PickStatus } from "../domain/rules"
  import type { CatalogTitle, SearchPage } from "../domain/types"
  import SearchResult from "./SearchResult.svelte"

  interface Props {
    page: SearchPage
    onPick: (title: CatalogTitle) => void
    statusOf?: (title: CatalogTitle) => PickStatus
  }

  let { page, onPick, statusOf = () => "idle" }: Props = $props()
</script>

{#if page.stale}
  <p class="text-xs text-muted-foreground">Saved results: the catalog could not be reached.</p>
{/if}
{#if page.results.length > 0}
  <ul class="flex flex-col divide-y divide-border rounded-lg border border-border">
    {#each page.results as item (catalogKey(item))}
      <li><SearchResult {item} {onPick} status={statusOf(item)} /></li>
    {/each}
  </ul>
{:else}
  <p class="py-10 text-center text-sm text-muted-foreground">No titles found on this page.</p>
{/if}
