<script lang="ts">
  import { Clapperboard } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { AsyncView, EmptyState, Resource, ScrollRow } from "@/shared/ui"
  import { DEFAULT_FILTERS } from "../domain/filters"
  import { useWatch } from "./context"
  import { spaceNames } from "./space-names.svelte"
  import ContinueCard from "./ContinueCard.svelte"

  /** Home shows only the first few titles in progress. */
  const SHOWN = 8

  interface Props {
    spaceId: string
    itemHref: (id: string) => string
    listHref: string
    /** The signed-in person, drawn in the brand tone on each card. */
    me?: string
  }

  let { spaceId, itemHref, listHref, me }: Props = $props()
  const { service } = useWatch()
  const watching = new Resource(() =>
    service.list(spaceId, { ...DEFAULT_FILTERS, myStatus: "watching", sort: "recent" }),
  )
  $effect(() => void watching.load())
  const names = spaceNames(() => spaceId)
</script>

<AsyncView resource={watching}>
  {#snippet children(page)}
    {#if page.items.length === 0}
      <EmptyState
        icon={Clapperboard}
        title="Nothing in progress"
        description="Titles you mark as watching show up here so you can pick up where you left off."
      >
        <Button variant="outline" href={listHref}>Open your list</Button>
      </EmptyState>
    {:else}
      <ScrollRow label="Titles in progress">
        {#each page.items.slice(0, SHOWN) as item (item.id)}
          <li class="w-[85%] max-w-72 shrink-0 snap-start sm:w-72">
            <ContinueCard {item} href={itemHref(item.id)} names={names.value ?? []} {me} />
          </li>
        {/each}
      </ScrollRow>
    {/if}
  {/snippet}
</AsyncView>
