<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { useAuth } from "@/features/auth"
  import { ActivityFeed } from "@/features/notifications"
  import { RecommendationsInbox } from "@/features/recommendations"
  import { UpcomingTasks } from "@/features/tasks"
  import { ContinueWatching } from "@/features/watch"
  import { buildHash } from "@/shared/domain"
  import { templateFor, type Space } from "@/features/spaces"

  let { space }: { space: Space } = $props()
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
  <Card.Root>
    <Card.Header><Card.Title>Continue watching</Card.Title></Card.Header>
    <Card.Content>
      <ContinueWatching
        spaceId={space.id}
        listHref={buildHash({ name: "watch", spaceId: space.id })}
        itemHref={(itemId) => buildHash({ name: "watch-item", spaceId: space.id, itemId })}
      />
    </Card.Content>
  </Card.Root>
  <Card.Root>
    <Card.Header><Card.Title>Coming up</Card.Title></Card.Header>
    <Card.Content>
      <UpcomingTasks
        spaceId={space.id}
        taskHref={(ideaId) => buildHash({ name: "idea", spaceId: space.id, ideaId, tab: "tasks" })}
      />
    </Card.Content>
  </Card.Root>
  <Card.Root>
    <Card.Header><Card.Title>Recommended for you</Card.Title></Card.Header>
    <Card.Content>
      <RecommendationsInbox
        spaceId={space.id}
        itemHref={(itemId) => buildHash({ name: "watch-item", spaceId: space.id, itemId })}
      />
    </Card.Content>
  </Card.Root>
  <Card.Root>
    <Card.Header><Card.Title>Recently in {space.name}</Card.Title></Card.Header>
    <Card.Content><ActivityFeed spaceId={space.id} limit /></Card.Content>
  </Card.Root>
</div>
