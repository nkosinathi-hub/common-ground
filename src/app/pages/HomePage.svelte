<script lang="ts">
  import { greetingFor } from "../shell/greeting"
  import { SharedWithYou } from "@/features/notes"
  import { visibleCards } from "@/shared/domain"
  import HomeCard from "./home/HomeCard.svelte"
  import { RENDERABLE_CARDS } from "./home/cards"
  import { SpaceBanner, type Space } from "@/features/spaces"

  interface Props {
    space: Space
    /** The signed-in member's name, for the greeting. */
    displayName: string
  }

  let { space, displayName }: Props = $props()
  const greeting = greetingFor(new Date().getHours())
  // The owner's layout, limited to the cards this build can render.
  const cards = $derived(visibleCards(space.homeCards, RENDERABLE_CARDS))
</script>

<div class="grid gap-6">
  <SpaceBanner {space} title={`${greeting}, ${displayName}`} />
  <!-- Above every card, whatever the layout: something shared with you, until it is opened. -->
  <SharedWithYou spaceId={space.id} />
  <div class="grid gap-6 md:grid-cols-2">
    {#each cards as id (id)}
      <HomeCard {id} {space} />
    {/each}
  </div>
</div>
