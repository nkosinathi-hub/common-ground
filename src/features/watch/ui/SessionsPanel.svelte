<script lang="ts">
  import { untrack } from "svelte"
  import { Users } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { AsyncView, Resource } from "@/shared/ui"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import LogSessionDialog from "./LogSessionDialog.svelte"

  interface Props {
    item: WatchItem
    /** Current members, to pick who was there. */
    members: readonly MemberRef[]
    /** Names for past sessions, including removed people still visible. */
    authors: readonly MemberRef[]
    onLogged: () => void
  }

  let { item, members, authors, onLogged }: Props = $props()
  const { service } = useWatch()
  const sessions = new Resource(() => service.sessions(item.id))
  let logging = $state(false)

  $effect(() => {
    // Reload when the title changes; the load itself must not become a dependency.
    void item.id
    untrack(() => void sessions.load())
  })

  const names = (ids: readonly string[]) => ids.map((id) => memberName(authors, id)).join(", ")
</script>

<section
  class="flex flex-col gap-stack rounded-lg border border-border bg-card p-card"
  aria-labelledby="sessions-heading"
>
  <div class="flex flex-col gap-hairline">
    <h2 id="sessions-heading" class="type-h3">Watched together</h2>
    <p class="type-sm text-muted-foreground">A shared record, separate from your own progress.</p>
  </div>
  <div class="order-last">
    <Button variant="outline" size="sm" onclick={() => (logging = true)}>
      <Users aria-hidden="true" />
      Log watched together
    </Button>
  </div>
  <AsyncView resource={sessions}>
    {#snippet children(list)}
      {#if list.length === 0}
        <p class="text-sm text-muted-foreground">
          Watched it as a group? Log the night and everyone there is marked completed.
        </p>
      {:else}
        <ul class="divide-y divide-border type-sm">
          {#each list as session (session.id)}
            <li class="py-2">
              <p class="font-medium">
                <time datetime={session.watchedOn}>{session.watchedOn}</time>
              </p>
              <p class="text-muted-foreground">{names(session.memberIds)}</p>
              {#if session.note}<p class="mt-1">{session.note}</p>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/snippet}
  </AsyncView>
</section>

<LogSessionDialog
  bind:open={logging}
  itemId={item.id}
  {members}
  onLogged={() => {
    void sessions.load()
    onLogged()
  }}
/>
