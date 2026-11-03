<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import type { Crumb } from "./breadcrumbs"

  interface Props {
    crumbs: readonly Crumb[]
  }

  let { crumbs }: Props = $props()
</script>

<!-- Detail pages keep their way back without a second fixed toolbar. -->
{#if crumbs.length > 2}
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol class="flex items-center gap-related">
      {#each crumbs as crumb, index (index)}
        <li class="flex min-w-0 items-center gap-related">
          {#if crumb.href}
            <a
              href={crumb.href}
              class="truncate type-sm text-muted-foreground hover:text-foreground">{crumb.label}</a
            >
            <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {:else}
            <span aria-current="page" class="truncate type-label text-foreground"
              >{crumb.label}</span
            >
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
{/if}
