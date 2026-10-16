<script lang="ts">
  import { greetingFor } from "../shell/greeting"
  import { useAuth } from "@/features/auth"
  import { visibleCards } from "@/shared/domain"
  import HomeCard from "./home/HomeCard.svelte"
  import { RENDERABLE_CARDS } from "./home/cards"
  import { Illustration } from "@/shared/ui"
  import { templateFor, type Space } from "@/features/spaces"

  let { space }: { space: Space } = $props()
  const { session } = useAuth()
  const template = $derived(templateFor(space.template))
  const greeting = greetingFor(new Date().getHours())
  // The owner's layout arrives with space customisation (#24); until then, the default.
  const cards = $derived(visibleCards(undefined, RENDERABLE_CARDS))
</script>

<div class="grid gap-6">
  <section class="flex items-center justify-between gap-6 rounded-2xl bg-banner px-6 py-8">
    <div>
      <h1 class="text-2xl font-semibold">{greeting}, {session.user?.displayName}</h1>
      <p class="mt-1 text-muted-foreground">{template.headline} {template.welcome}</p>
    </div>
    <Illustration class="hidden h-24 shrink-0 sm:block" />
  </section>
  <div class="grid gap-6 md:grid-cols-2">
    {#each cards as id (id)}
      <HomeCard {id} {space} />
    {/each}
  </div>
</div>
