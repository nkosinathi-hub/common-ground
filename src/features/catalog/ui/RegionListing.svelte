<script lang="ts">
  import { ExternalLink } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import type { Region } from "../domain/types"

  interface Props {
    region: Region
  }

  let { region }: Props = $props()
</script>

<div class="space-y-3">
  {#each region.categories as category (category.key)}
    <div>
      <p class="mb-2 text-xs font-medium text-muted-foreground">{category.label}</p>
      <ul class="flex flex-wrap gap-2" aria-label={`${category.label} in ${region.name}`}>
        {#each category.providers as provider (provider)}
          <li><Badge variant="outline">{provider}</Badge></li>
        {/each}
      </ul>
    </div>
  {/each}
  {#if region.link}
    <a
      href={region.link}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline underline-offset-4"
    >
      Watch options in {region.name}
      <ExternalLink class="size-3" aria-hidden="true" />
    </a>
  {/if}
</div>
