<script lang="ts">
  import { untrack } from "svelte"
  import { LoaderCircle, RefreshCw } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { splitAvailability } from "../domain/rules"
  import type { CatalogType } from "../domain/types"
  import { AvailabilityState } from "./availability-state.svelte"
  import { useCatalog } from "./context"
  import OtherCountries from "./OtherCountries.svelte"
  import RegionListing from "./RegionListing.svelte"

  interface Props {
    spaceId: string
    type: CatalogType
    id: number
    /** The title, so each service row can search its own site for it. */
    title?: string
    /** Once loaded: the first provider here, for the phone's "Where to watch" row. */
    onloaded?: (listing: { firstProvider: string | null }) => void
  }

  let { spaceId, type, id, title = "", onloaded }: Props = $props()

  const listing = new AvailabilityState(useCatalog().service)
  const split = $derived(listing.details ? splitAvailability(listing.details.availability) : null)
  $effect(() => {
    const firstProvider = split?.home?.categories[0]?.providers[0] ?? null
    if (listing.details) untrack(() => onloaded?.({ firstProvider }))
  })

  $effect(() => {
    // Reload when the title or space changes; the load itself must not become a dependency.
    const ref = { type, id }
    const space = spaceId
    untrack(() => void listing.load(space, ref))
    return () => listing.cancel()
  })
</script>

<!-- D03a "Where to watch": region and refresh on the title line, then each provider as a link. -->
<Card.Root role="region" aria-label="Where to watch">
  <Card.Header>
    <Card.Title>Where to watch</Card.Title>
    <Card.Action class="flex items-center gap-related">
      <Badge variant="outline" title="South Africa">ZA</Badge>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={listing.error ? "Try again" : "Refresh listings"}
        disabled={listing.loading}
        onclick={() => listing.load(spaceId, { type, id }, true)}
      >
        <RefreshCw />
      </Button>
    </Card.Action>
  </Card.Header>
  <Card.Content class="flex flex-col gap-related">
    {#if listing.loading}
      <p class="flex items-center gap-related type-xs text-muted-foreground">
        <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
        Checking streaming listings
      </p>
    {/if}
    {#if listing.error}
      <p role="alert" class="type-sm text-destructive">
        {listing.error.message}{listing.details
          ? " Previously loaded listings are shown below."
          : ""}
      </p>
    {/if}
    {#if listing.details && split}
      {#if split.home}<RegionListing region={split.home} {title} />{/if}
      <OtherCountries regions={split.others} fallback={split.fallback} {title} />
      {#if listing.details.stale}
        <p class="flex flex-wrap items-center gap-related type-xs text-muted-foreground">
          <Badge variant="outline">Stale</Badge>
          TMDB could not be reached, so these listings may be out of date.
        </p>
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
