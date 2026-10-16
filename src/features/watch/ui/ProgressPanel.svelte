<script lang="ts">
  import { untrack } from "svelte"
  import { AsyncView, Resource } from "@/shared/ui"
  import { progressSummary } from "../domain/labels"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { WatchItem } from "../domain/types"
  import { useWatch } from "./context"
  import ProgressForm from "./ProgressForm.svelte"

  interface Props {
    item: WatchItem
    /** Names for everyone with progress, including removed people still visible. */
    authors: readonly MemberRef[]
    /** Bumped by the parent when progress changed elsewhere (a watched-together log). */
    version: number
    onSaved: () => void
  }

  let { item, authors, version, onSaved }: Props = $props()
  const { service } = useWatch()
  const progress = new Resource(() => service.progress(item.id))

  $effect(() => {
    // Reload when the title changes or the parent bumps the version.
    void [item.id, version]
    untrack(() => void progress.load())
  })

  const nameOf = (id: string, me: string) => (id === me ? "You" : memberName(authors, id))
</script>

<section class="space-y-4 rounded-xl border p-4" aria-labelledby="progress-heading">
  <h2 id="progress-heading" class="font-semibold">Your place in the story</h2>
  <AsyncView resource={progress}>
    {#snippet children(state)}
      <ProgressForm
        itemId={item.id}
        episodic={item.mediaType !== "movie"}
        mine={state.entries.find((p) => p.userId === state.me) ?? null}
        onSaved={() => {
          void progress.load()
          onSaved()
        }}
      />
      <div class="border-t pt-4">
        <h3 class="mb-2 text-sm font-medium">Everyone's progress</h3>
        {#if state.entries.length === 0}
          <p class="text-sm text-muted-foreground">Nobody has started this one yet.</p>
        {:else}
          <ul class="space-y-1 text-sm">
            {#each state.entries as entry (entry.userId)}
              <li class="flex flex-wrap justify-between gap-2">
                <span class="font-medium">{nameOf(entry.userId, state.me)}</span>
                <span class="text-muted-foreground">
                  {progressSummary(entry)}{entry.completedOn
                    ? `, finished ${entry.completedOn}`
                    : ""}
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/snippet}
  </AsyncView>
</section>
