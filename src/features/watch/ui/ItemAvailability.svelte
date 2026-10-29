<script lang="ts">
  import { Availability } from "@/features/catalog"
  import type { WatchItem } from "../domain/types"
  import AvailabilityNote from "./AvailabilityNote.svelte"

  interface Props {
    spaceId: string
    item: WatchItem
    onChanged: () => void
  }

  let { spaceId, item, onChanged }: Props = $props()
</script>

<!-- Catalog titles list their providers; a title added by hand has only the space's note. -->
{#if item.catalog}
  <Availability {spaceId} type={item.catalog.type} id={item.catalog.id} />
{:else}
  <AvailabilityNote {item} {onChanged} />
{/if}
