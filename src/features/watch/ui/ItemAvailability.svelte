<script lang="ts">
  import { Compass } from "@lucide/svelte"
  import { Availability } from "@/features/catalog"
  import type { WatchItem } from "../domain/types"

  interface Props {
    spaceId: string
    item: WatchItem
  }

  let { spaceId, item }: Props = $props()
</script>

{#if item.catalog}
  <Availability {spaceId} type={item.catalog.type} id={item.catalog.id} />
{/if}

{#if !item.catalog || item.availabilityNote}
  <section class="rounded-lg bg-muted p-inset" aria-label="Availability note">
    <h2 class="mb-related flex items-center gap-related type-label">
      <Compass class="size-4" aria-hidden="true" />
      {item.catalog ? "Your availability note" : "Where to watch"}
    </h2>
    <p class="type-sm text-muted-foreground">
      {item.availabilityNote ?? "No availability note added."}
    </p>
    <p class="mt-related type-xs text-muted-foreground">
      {item.catalog
        ? "A note from your space, separate from the catalog listings."
        : "Member-entered note. No verified provider data."}
    </p>
  </section>
{/if}
