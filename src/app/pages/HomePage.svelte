<script lang="ts">
  import type { Snippet } from "svelte"
  import * as Card from "$lib/components/ui/card"
  import { useAuth } from "@/features/auth"
  import { ActivityFeed } from "@/features/notifications"
  import { templateFor, type Space } from "@/features/spaces"

  let { space, sections }: { space: Space; sections?: Snippet } = $props()
  const { session } = useAuth()
  const template = $derived(templateFor(space.template))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
</script>

<div class="grid gap-6">
  <section class="rounded-2xl bg-banner px-6 py-8">
    <h1 class="text-2xl font-semibold">{greeting}, {session.user?.displayName}</h1>
    <p class="mt-1 text-muted-foreground">{template.headline} {template.welcome}</p>
  </section>
  {@render sections?.()}
  <Card.Root>
    <Card.Header><Card.Title>Recently in {space.name}</Card.Title></Card.Header>
    <Card.Content><ActivityFeed spaceId={space.id} limit /></Card.Content>
  </Card.Root>
</div>
