<script lang="ts">
  import { greetingFor } from "../shell/greeting"
  import { SharedWithYou } from "@/features/notes"
  import { HOME_CARD_COLUMN, visibleCards } from "@/shared/domain"
  import { MediaQuery } from "svelte/reactivity"
  import HomeCard from "./home/HomeCard.svelte"
  import MobileHome from "./home/MobileHome.svelte"
  import { RENDERABLE_CARDS } from "./home/cards"
  import { SpaceBanner, type Space } from "@/features/spaces"

  interface Props {
    space: Space
    /** The signed-in member's name, for the greeting. */
    displayName: string
  }

  let { space, displayName }: Props = $props()
  const greeting = greetingFor(new Date().getHours())
  // The owner's layout, limited to the cards this build can render, split into two columns.
  const cards = $derived(visibleCards(space.homeCards, RENDERABLE_CARDS))
  const main = $derived(cards.filter((id) => HOME_CARD_COLUMN[id] === "main"))
  const aside = $derived(cards.filter((id) => HOME_CARD_COLUMN[id] === "aside"))
  // Phones get their own arrangement (M01), not the two columns squeezed into one.
  const wide = new MediaQuery("min-width: 768px")
</script>

<!-- D01: the welcome, then the shared life beside a narrow column of what is next. -->
<div class="flex flex-col gap-section">
  <SpaceBanner {space} title={`${greeting}, ${displayName}.`} />
  <!-- Above every card, whatever the layout: something shared with you, until it is opened. -->
  <SharedWithYou spaceId={space.id} />
  {#if !wide.current}
    <MobileHome spaceId={space.id} spaceName={space.name} {cards} />
  {:else}
    <div class="grid gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
      <div class="flex min-w-0 flex-col gap-stack">
        {#each main as id (id)}<HomeCard {id} {space} />{/each}
      </div>
      <div class="flex min-w-0 flex-col gap-stack">
        {#each aside as id (id)}<HomeCard {id} {space} />{/each}
      </div>
    </div>
  {/if}
</div>
