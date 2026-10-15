<script lang="ts" generics="T extends { id: string }, C">
  import { ErrorState, Loading, LoadMore, type PagedList } from "@/shared/ui"

  interface Props {
    list: PagedList<T, C>
    empty: string
  }

  let { list, empty }: Props = $props()
</script>

{#if list.items.length === 0}
  {#if list.error}
    <ErrorState error={list.error} onRetry={() => list.load()} />
  {:else if list.loading}
    <Loading rows={2} />
  {:else}
    <p class="text-sm text-muted-foreground">{empty}</p>
  {/if}
{/if}
<LoadMore {list} />
