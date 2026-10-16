<script lang="ts">
  import { greetingFor } from "../shell/greeting"
  import { useAuth } from "@/features/auth"
  import { visibleCards } from "@/shared/domain"
  import HomeCard from "./home/HomeCard.svelte"
  import { RENDERABLE_CARDS } from "./home/cards"
  import { SpaceBanner, type Space } from "@/features/spaces"

  let { space }: { space: Space } = $props()
  const { session } = useAuth()
  const greeting = greetingFor(new Date().getHours())
  // The owner's layout, limited to the cards this build can render.
  const cards = $derived(visibleCards(space.homeCards, RENDERABLE_CARDS))
</script>

<div class="grid gap-6">
  <SpaceBanner {space} title={`${greeting}, ${session.user?.displayName}`} />
  <div class="grid gap-6 md:grid-cols-2">
    {#each cards as id (id)}
      <HomeCard {id} {space} />
    {/each}
  </div>
</div>
