<script lang="ts">
  import { untrack } from "svelte"
  import { CalendarDays, Plus } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { AsyncView, ListRow, Resource } from "@/shared/ui"
  import { formatDateOnly, memberName, type MemberRef } from "@/shared/domain"
  import { placeHeading, type Place } from "../domain/places"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import LogSessionDialog from "./LogSessionDialog.svelte"

  interface Props {
    item: WatchItem
    /** Where the space is together; only a watch party or a logged night moves it. */
    together: Place | null
    /** Current members, to pick who was there. */
    members: readonly MemberRef[]
    /** Names for past sessions, including removed people still visible. */
    authors: readonly MemberRef[]
    onLogged: () => void
  }

  let { item, together, members, authors, onLogged }: Props = $props()
  const { service } = useWatch()
  const sessions = new Resource(() => service.sessions(item.id))
  const place = $derived(together ? placeHeading(together) : null)
  let logging = $state(false)

  $effect(() => {
    // Reload when the title changes; the load itself must not become a dependency.
    void item.id
    untrack(() => void sessions.load())
  })

  const names = (ids: readonly string[]) => ids.map((id) => memberName(authors, id)).join(", ")
</script>

<!-- D03a "Watched together": the shared record, with where the space is together on its title. -->
<Card.Root role="region" aria-labelledby="sessions-heading">
  <Card.Header>
    <Card.Title id="sessions-heading">Watched together</Card.Title>
    <Card.Description>A shared record, separate from personal progress.</Card.Description>
    {#if place}
      <Card.Action>
        <Badge variant="secondary"><span class="sr-only">Together at</span> {place}</Badge>
      </Card.Action>
    {/if}
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <AsyncView resource={sessions}>
      {#snippet children(list)}
        {#if list.length === 0}
          <p class="type-sm text-muted-foreground">
            Watched it as a group? Log the night and everyone there is marked completed.
          </p>
        {:else}
          <ul class="flex flex-col">
            {#each list as session (session.id)}
              <li>
                <ListRow
                  icon={CalendarDays}
                  title={formatDateOnly(session.watchedOn)}
                  meta={[names(session.memberIds), session.note].filter(Boolean).join(" · ")}
                />
              </li>
            {/each}
          </ul>
        {/if}
      {/snippet}
    </AsyncView>
    <Button variant="outline" size="sm" class="self-start" onclick={() => (logging = true)}>
      <Plus aria-hidden="true" />Log watched together
    </Button>
  </Card.Content>
</Card.Root>

<LogSessionDialog
  bind:open={logging}
  itemId={item.id}
  {members}
  onLogged={() => {
    void sessions.load()
    onLogged()
  }}
/>
