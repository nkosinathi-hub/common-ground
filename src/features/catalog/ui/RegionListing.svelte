<script lang="ts">
  import { ArrowUpRight, Tv } from "@lucide/svelte"
  import type { ProviderCategoryKey, Region } from "../domain/types"
  import { providerLink } from "../domain/provider-links"
  import { safeHref } from "./safe-href"

  let { region, title = "" }: { region: Region; title?: string } = $props()
  const listing = $derived(safeHref(region.link))
  // A known service opens its own search for the title; others keep the region's listing page.
  const hrefFor = (provider: string) => (title && providerLink(provider, title)) || listing
  const HOW: Record<ProviderCategoryKey, string> = {
    flatrate: "Stream with subscription",
    free: "Stream free",
    ads: "Stream free with ads",
    rent: "Rent",
    buy: "Buy",
  }
</script>

<!-- Provider row (287:9578): the whole row opens the service, or the region's listing page. -->
{#snippet row(provider: string, how: string, href: string | null)}
  <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-foreground">
    <Tv class="size-5 text-background" aria-hidden="true" />
  </span>
  <span class="flex min-w-0 flex-1 flex-col">
    <span class="truncate type-label text-foreground">{provider}</span>
    <span class="truncate type-xs text-muted-foreground">{how}</span>
  </span>
  {#if href}<ArrowUpRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{/if}
{/snippet}

<div class="flex flex-col">
  {#each region.categories as category (category.key)}
    <ul aria-label={`${category.label} in ${region.name}`}>
      {#each category.providers as provider (provider)}
        {@const how = HOW[category.key] ?? category.label}
        {@const href = hrefFor(provider)}
        <li>
          {#if href}
            <a
              {href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={href === listing
                ? `${provider}, ${how}: watch options in ${region.name}`
                : `${provider}, ${how}: open ${provider}`}
              class="flex min-h-14 items-center gap-item rounded-md outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/20"
              >{@render row(provider, how, href)}</a
            >
          {:else}
            <div class="flex min-h-14 items-center gap-item">
              {@render row(provider, how, href)}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/each}
</div>
