<script lang="ts">
  import { untrack } from "svelte"
  import { Play } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { buildHash } from "@/shared/domain"
  import { Resource } from "@/shared/ui"
  import { useParties } from "./context"
  import StartPartyDialog from "./StartPartyDialog.svelte"

  interface Props {
    spaceId: string
    itemId: string
    /** A film has no episodes to pick. */
    isFilm: boolean
  }

  let { spaceId, itemId, isFilm }: Props = $props()
  const { service } = useParties()
  const open = new Resource(() => service.openFor(itemId))
  let starting = $state(false)

  $effect(() => {
    void itemId
    untrack(() => void open.load())
  })
</script>

{#if open.value}
  <!-- The title page's primary action (D03a). -->
  <Button href={buildHash({ name: "party", spaceId, partyId: open.value.id })}>
    <Play aria-hidden="true" />
    Join the watch party
  </Button>
{:else if open.state.status !== "loading"}
  <Button onclick={() => (starting = true)}>
    <Play aria-hidden="true" />
    Watch together
  </Button>
  <StartPartyDialog bind:open={starting} {spaceId} {itemId} {isFilm} />
{/if}
