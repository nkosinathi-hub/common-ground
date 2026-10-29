<script lang="ts">
  import { ArrowUpRight, Tv } from "@lucide/svelte"
  import { ListRow } from "@/shared/ui"
  import type { Region } from "../domain/types"
  import { safeHref } from "./safe-href"

  interface Props {
    region: Region
    /** When the listing was checked, e.g. "27 Oct 2026, 18:00", on every provider row. */
    checked?: string
  }

  let { region, checked }: Props = $props()
  const href = $derived(safeHref(region.link))
</script>

<!-- D03a provider rows: the service, how it is offered and when that was checked. -->
<div class="flex flex-col gap-related">
  {#each region.categories as category (category.key)}
    <ul aria-label={`${category.label} in ${region.name}`}>
      {#each category.providers as provider (provider)}
        <li>
          <ListRow
            icon={Tv}
            title={provider}
            meta={[category.label, checked && `checked ${checked}`].filter(Boolean).join(" · ")}
          />
        </li>
      {/each}
    </ul>
  {/each}
  {#if href}
    <a
      {href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch options in ${region.name} on TMDB / JustWatch`}
      class="inline-flex w-fit items-center gap-related rounded-sm type-label text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/20"
    >
      TMDB / JustWatch
      <ArrowUpRight class="size-4" aria-hidden="true" />
    </a>
  {:else if region.link}
    <p class="type-xs text-muted-foreground">Watch options in {region.name}: {region.link}</p>
  {/if}
</div>
