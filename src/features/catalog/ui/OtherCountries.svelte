<script lang="ts">
  import type { Region } from "../domain/types"
  import RegionListing from "./RegionListing.svelte"

  interface Props {
    regions: readonly Region[]
    /** True when South Africa has no listings and these countries are the fallback. */
    fallback: boolean
  }

  let { regions, fallback }: Props = $props()

  const count = $derived(`${regions.length} ${regions.length === 1 ? "country" : "countries"}`)
</script>

{#if regions.length > 0}
  <details class="rounded-lg border bg-background p-3">
    <summary class="cursor-pointer text-xs font-medium text-primary">
      {#if fallback}
        No availability listed for South Africa
        <span class="font-normal text-muted-foreground">(listings in {count})</span>
      {:else}
        Other countries ({count})
      {/if}
    </summary>
    <div class="mt-4 max-h-72 space-y-5 overflow-y-auto">
      {#each regions as region (region.code)}
        <section aria-label={region.name}>
          <h4 class="mb-3 text-sm font-medium">{region.name}</h4>
          <RegionListing {region} />
        </section>
      {/each}
    </div>
  </details>
{:else if fallback}
  <div>
    <p class="text-sm font-medium">No availability listed for South Africa</p>
    <p class="text-xs text-muted-foreground">
      The source has no provider listings for this title yet.
    </p>
  </div>
{/if}
