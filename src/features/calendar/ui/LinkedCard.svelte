<script lang="ts">
  import { Lightbulb, Link as LinkIcon, SquareCheck, Tv } from "@lucide/svelte"
  import * as Card from "$lib/components/ui/card"
  import { EmptyState, ListRow } from "@/shared/ui"
  import type { CalendarEvent } from "../domain"
  import { linkHref } from "./links"

  const KIND = {
    watch_item: { label: "Watch", icon: Tv },
    idea: { label: "Idea", icon: Lightbulb },
    task: { label: "Task", icon: SquareCheck },
  } as const

  let { event, spaceId }: { event: CalendarEvent; spaceId: string } = $props()
  const link = $derived(event.link)
  const href = $derived(link ? linkHref(spaceId, link) : null)
</script>

<!-- D14 "Linked to": the title, idea or task this plan is for. -->
<Card.Root>
  <Card.Header><Card.Title>Linked to</Card.Title></Card.Header>
  <Card.Content>
    {#if link}
      {@const kind = KIND[link.kind]}
      <ListRow href={href ?? undefined} title={link.label} meta={kind.label} icon={kind.icon} />
    {:else}
      <EmptyState
        icon={LinkIcon}
        title="Nothing linked yet"
        description="Edit the event to link a Watch title, idea or task."
        level={3}
      />
    {/if}
  </Card.Content>
</Card.Root>
