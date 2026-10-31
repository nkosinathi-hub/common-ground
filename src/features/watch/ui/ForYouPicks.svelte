<script lang="ts">
  import { untrack } from "svelte"
  import { genreName, Poster } from "@/features/catalog"
  import { ListRow, Resource } from "@/shared/ui"
  import { DEFAULT_FILTERS } from "../domain/filters"
  import { useWatch } from "./context"
  import { useForYou } from "./for-you.svelte"

  interface Props {
    spaceId: string
    itemHref: (itemId: string) => string
  }

  let { spaceId, itemHref }: Props = $props()
  const { service } = useWatch()
  const forYou = useForYou(() => spaceId)
  const unstarted = new Resource(() =>
    service.list(spaceId, { ...DEFAULT_FILTERS, sort: "for_you", myStatus: "not_started" }),
  )
  // Your top three you have not started; a title you disliked never shows here.
  const picks = $derived(
    (unstarted.value?.items ?? []).filter((item) => !forYou.disliked(item.id)).slice(0, 3),
  )

  $effect(() => {
    void spaceId
    untrack(() => void (unstarted.load(), forYou.scores.load()))
  })
</script>

<!-- Home's Recommended card when nothing waits: For you from the space's own list. -->
{#if picks.length > 0}
  <section class="flex min-w-0 flex-col" aria-labelledby="for-you-heading">
    <h3 id="for-you-heading" class="type-label-sm text-muted-foreground">For you</h3>
    <ul>
      {#each picks as item (item.id)}
        <li>
          <ListRow
            title={item.title}
            meta={item.reason ? `Because you liked ${genreName(item.reason)}` : undefined}
            href={itemHref(item.id)}
          >
            {#snippet leading()}
              <Poster
                path={item.posterPath}
                title={item.title}
                size="w92"
                class="h-15 w-10 shrink-0 rounded-sm"
              />
            {/snippet}
          </ListRow>
        </li>
      {/each}
    </ul>
  </section>
{/if}
