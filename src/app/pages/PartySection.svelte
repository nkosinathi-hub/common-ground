<script lang="ts">
  import { PartyPage } from "@/features/parties"
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
  <PartyPage {spaceId} {partyId} {me} {itemHref} />
{/key}
