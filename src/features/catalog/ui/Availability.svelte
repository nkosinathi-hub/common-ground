<script lang="ts">
  import { untrack } from "svelte"
  import { Compass, LoaderCircle, RefreshCw } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { formatDateTime } from "@/shared/domain"
  import { splitAvailability } from "../domain/rules"
  import type { CatalogType } from "../domain/types"
  import Attribution from "./Attribution.svelte"
  import { AvailabilityState } from "./availability-state.svelte"
  import { useCatalog } from "./context"
  import OtherCountries from "./OtherCountries.svelte"
  import RegionListing from "./RegionListing.svelte"

  interface Props {
    spaceId: string
    type: CatalogType
    id: number
  }

  let { spaceId, type, id }: Props = $props()

  const listing = new AvailabilityState(useCatalog().service)
  const split = $derived(listing.details ? splitAvailability(listing.details.availability) : null)
  const checked = $derived(listing.details ? formatDateTime(listing.details.checkedAt) : "")

  $effect(() => {
    // Reload when the title or space changes; the load itself must not become a dependency.
    const ref = { type, id }
    const space = spaceId
    untrack(() => void listing.load(space, ref))
    return () => listing.cancel()
  })
</script>

<section class="space-y-4 rounded-xl border bg-card p-4" aria-label="Where to watch">
  <header class="flex items-center justify-between gap-2">
    <h2 class="flex items-center gap-2 text-sm font-medium">
      <Compass class="size-4" aria-hidden="true" />
      Where to watch
    </h2>
    <Badge variant="secondary">South Africa</Badge>
  </header>

  {#if listing.loading}
    <p class="flex items-center gap-2 text-xs text-muted-foreground">
      <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
      Checking streaming listings
    </p>
  {/if}
  {#if listing.error}
    <p role="alert" class="text-sm leading-6 text-destructive">
      {listing.error.message}{listing.details ? " Previously loaded listings are shown below." : ""}
    </p>
  {/if}

  {#if listing.details && split}
    {#if split.home}
      <RegionListing region={split.home} />
    {/if}
    <OtherCountries regions={split.others} fallback={split.fallback} />
    <p class="text-xs leading-5 text-muted-foreground">
      Listings are not exhaustive and do not guarantee access across borders. Links open
      country-level watch options, not provider streams.
    </p>
    <p class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Checked <time datetime={listing.details.checkedAt}>{checked}</time></span>
      {#if listing.details.stale}
        <Badge variant="outline">Stale</Badge>
        <span>TMDB could not be reached, so these listings may be out of date.</span>
      {/if}
    </p>
  {/if}

  <Button
    variant="ghost"
    size="sm"
    class="px-0"
    disabled={listing.loading}
    onclick={() => listing.load(spaceId, { type, id }, true)}
  >
    <RefreshCw aria-hidden="true" />
    {listing.error ? "Try again" : "Refresh listings"}
  </Button>
  <Attribution />
</section>
