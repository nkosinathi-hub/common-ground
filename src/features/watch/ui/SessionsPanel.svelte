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
    members: readonly MemberRef[]
    onLogged: () => void
  }

  let { item, members, onLogged }: Props = $props()
  const { service } = useWatch()
  const sessions = new Resource(() => service.sessions(item.id))
  let logging = $state(false)

  $effect(() => {
    // Reload when the title changes; the load itself must not become a dependency.
    void item.id
    untrack(() => void sessions.load())
  })

  const names = (ids: readonly string[]) => ids.map((id) => memberName(members, id)).join(", ")
</script>

<section class="space-y-4 rounded-xl border p-4" aria-labelledby="sessions-heading">
  <div class="flex flex-wrap items-center justify-between gap-2">
    <h2 id="sessions-heading" class="font-semibold">Watched together</h2>
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
        <ul class="divide-y text-sm">
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
