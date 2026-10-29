<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs"
  import { EVENT_TABS, type EventTab } from "./event-tabs"

  let { value = $bindable("details") }: { value: EventTab } = $props()
</script>

<!-- S06 Details, When and People, under the composer's title. -->
<Tabs.Root bind:value>
  <Tabs.List variant="line" aria-label="Event parts" class="w-full justify-start">
    {#each EVENT_TABS as option (option.value)}
      <Tabs.Trigger value={option.value}>{option.label}</Tabs.Trigger>
    {/each}
  </Tabs.List>
</Tabs.Root>
