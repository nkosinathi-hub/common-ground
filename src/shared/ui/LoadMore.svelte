<script lang="ts">
  import { Button } from "$lib/components/ui/button"

  interface Props {
    list: { hasMore: boolean; loadingMore: boolean; error: unknown; loadMore: () => Promise<void> }
    label?: string
  }

  let { list, label = "Load more" }: Props = $props()
  const text = $derived.by(() => {
    if (list.loadingMore) return "Loading"
    return list.error ? "Try again" : label
  })
</script>

{#if list.hasMore}
  <div class="flex justify-center py-2">
    <Button variant="outline" disabled={list.loadingMore} onclick={() => list.loadMore()}
      >{text}</Button
    >
  </div>
{/if}
