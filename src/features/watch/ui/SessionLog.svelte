<script lang="ts">
  import { untrack } from "svelte"
  import { History, Plus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { formatShortDay, memberName, type MemberRef } from "@/shared/domain"
  import { AvatarStack, Resource } from "@/shared/ui"
  import { rangeLabel } from "../domain/title-facts"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import LogSessionDialog from "./LogSessionDialog.svelte"

  interface Props {
    item: WatchItem
    /** Current members, to pick who was there. */
    members: readonly MemberRef[]
    /** Names for past nights, including removed people still visible. */
    authors: readonly MemberRef[]
    /** Bumped when a party finishes elsewhere on the page. */
    version: number
    onLogged: () => void
  }

  let { item, members, authors, version, onLogged }: Props = $props()
  const { service } = useWatch()
  const sessions = new Resource(() => service.sessions(item.id))
  let logging = $state(false)

  $effect(() => {
    void [item.id, version]
    untrack(() => void sessions.load())
  })
</script>

<!-- Watched together, inside the Progress card: parties log themselves; plus logs one by hand. -->
<section class="flex flex-col gap-related" aria-labelledby="sessions-heading">
  <div class="flex items-center justify-between">
    <h3 id="sessions-heading" class="type-label-sm text-foreground">Watched together</h3>
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Log watched together"
      onclick={() => (logging = true)}
    >
      <Plus />
    </Button>
  </div>
  {#if sessions.value && sessions.value.length > 0}
    <ul class="flex flex-col">
      {#each sessions.value as session (session.id)}
        {@const people = session.memberIds.map((id) => ({ name: memberName(authors, id) }))}
        <li class="flex min-h-11 items-center gap-related">
          <History class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span class="type-label-sm text-foreground">{formatShortDay(session.watchedOn)}</span>
          <span class="min-w-0 flex-1 truncate type-sm text-muted-foreground"
            >{rangeLabel(session.range) ?? session.note ?? ""}</span
          >
          <AvatarStack {people} label={people.map((p) => p.name).join(", ")} size="sm" />
        </li>
      {/each}
    </ul>
  {:else if sessions.value}
    <p class="type-sm text-muted-foreground">Watch parties log themselves here.</p>
  {/if}
</section>

<LogSessionDialog
  bind:open={logging}
  itemId={item.id}
  title={{ title: item.title, posterPath: item.posterPath }}
  {members}
  onLogged={() => {
    void sessions.load()
    onLogged()
  }}
/>
