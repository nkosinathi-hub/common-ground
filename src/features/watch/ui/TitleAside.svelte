<script lang="ts">
  import { Availability, AvailabilitySheet } from "@/features/catalog"
  import type { WatchItem } from "../domain/types"
  import AvailabilityNote from "./AvailabilityNote.svelte"
  import ProgressCard from "./ProgressCard.svelte"
  import type { TitlePage } from "./title-page.svelte"

  interface Props {
    page: TitlePage
    item: WatchItem
    wide: boolean
    onchecked: (checkedAt: string) => void
  }

  let { page, item, wide, onchecked }: Props = $props()
</script>

<!-- D03a aside: progress above the fold, then where to watch (a row with a sheet on phones). -->
<ProgressCard
  {item}
  progress={page.progress}
  seasons={page.seasons}
  members={page.people.value ?? []}
  authors={page.authors}
  version={page.version}
  onChanged={page.changed}
/>
{#if !item.catalog}
  <AvailabilityNote {item} />
{:else if wide}
  <Availability
    spaceId={item.spaceId}
    type={item.catalog.type}
    id={item.catalog.id}
    title={item.title}
    onloaded={(listing) => onchecked(listing.checkedAt)}
  />
{:else}
  <AvailabilitySheet
    spaceId={item.spaceId}
    type={item.catalog.type}
    id={item.catalog.id}
    title={item.title}
    {onchecked}
  />
{/if}
