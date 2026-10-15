<script lang="ts" generics="T extends { id: string }">
  import { Button } from "$lib/components/ui/button"
  import { ErrorState, Loading } from "@/shared/ui"
  import type { PagedList } from "./paged-list.svelte"

  let { list, empty }: { list: PagedList<T>; empty: string } = $props()
</script>

{#if list.error}
  <ErrorState error={list.error} onRetry={() => list.load()} />
{:else if list.loading && list.items.length === 0}
  <Loading rows={2} />
{:else if list.items.length === 0}
  <p class="text-sm text-muted-foreground">{empty}</p>
{/if}
{#if list.next}
  <Button variant="outline" size="sm" disabled={list.loading} onclick={() => list.load(true)}
    >Load more</Button
  >
{/if}
