<script lang="ts">
  import { PartyPage } from "@/features/parties"
  import { PlayerSlot, PlaySplitButton, TitlePlaybackScope } from "@/features/playback"
  import { buildHash } from "@/shared/domain"
  import { useCatalog } from "@/features/catalog/ui/context"
  import { playbackCatalog } from "../composition/playback-catalog"

  interface Props {
    spaceId: string
    partyId: string
    /** The signed-in member's id. */
    me: string
  }

  let { spaceId, partyId, me }: Props = $props()
  const catalog = playbackCatalog(useCatalog().service)
  const itemHref = (itemId: string) => buildHash({ name: "watch-item", spaceId, itemId })
</script>

{#key partyId}
  <PartyPage {spaceId} {partyId} {me} {itemHref}>
    {#snippet player(party)}
      <!-- The party drives this player's video (src/app/composition/player-bridge.ts). -->
      {#if party.catalog}
        <TitlePlaybackScope
          target={{ spaceId, itemId: party.watchItemId, catalog: party.catalog }}
          {catalog}
        >
          <div class="flex flex-col gap-stack">
            <PlaySplitButton /><PlayerSlot title={party.title} />
          </div>
        </TitlePlaybackScope>
      {:else}
        <p class="rounded-lg border p-inset type-sm text-muted-foreground">
          This title has no catalog entry, so nothing can play it in the app.
        </p>
      {/if}
    {/snippet}
  </PartyPage>
{/key}
