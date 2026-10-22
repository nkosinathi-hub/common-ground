<script lang="ts">
  import { PartyPage } from "@/features/parties"
  import { PlayButton } from "@/features/playback"
  import { buildHash } from "@/shared/domain"

  interface Props {
    spaceId: string
    partyId: string
    /** The signed-in member's id. */
    me: string
  }

  let { spaceId, partyId, me }: Props = $props()
  const itemHref = (itemId: string) => buildHash({ name: "watch-item", spaceId, itemId })
</script>

{#key partyId}
  <PartyPage {spaceId} {partyId} {me} {itemHref}>
    {#snippet player(party)}
      <!-- The party drives this player's video (src/app/composition/player-bridge.ts). -->
      {#if party.catalog}
        <PlayButton
          target={{ spaceId, itemId: party.watchItemId, catalog: party.catalog }}
          title={party.title}
        />
      {:else}
        <p class="rounded-xl border p-4 text-sm text-muted-foreground">
          This title has no catalog entry, so nothing can play it in the app.
        </p>
      {/if}
    {/snippet}
  </PartyPage>
{/key}
