<script lang="ts">
  import { untrack } from "svelte"
  import { Users } from "@lucide/svelte"
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
    /** Icon only, beside the play button in the phone's sticky bar. */
    compact?: boolean
  }

  let { spaceId, itemId, isFilm, compact = false }: Props = $props()
  const { service } = useParties()
  const open = new Resource(() => service.openFor(itemId))
  let starting = $state(false)

  $effect(() => {
    void itemId
    untrack(() => void open.load())
  })
</script>

<!-- The title page's one secondary action (D03a), beside Play. -->
{#if open.value}
  <Button
    variant="outline"
    size={compact ? "icon" : "default"}
    aria-label={compact ? "Join the watch party" : undefined}
    href={buildHash({ name: "party", spaceId, partyId: open.value.id })}
  >
    <Users aria-hidden="true" />{#if !compact}Join the watch party{/if}
  </Button>
{:else if open.state.status !== "loading"}
  <Button
    variant="outline"
    size={compact ? "icon" : "default"}
    aria-label={compact ? "Watch together" : undefined}
    onclick={() => (starting = true)}
  >
    <Users aria-hidden="true" />{#if !compact}Watch together{/if}
  </Button>
  <StartPartyDialog bind:open={starting} {spaceId} {itemId} {isFilm} />
{/if}
