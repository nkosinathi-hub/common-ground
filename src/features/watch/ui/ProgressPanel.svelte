<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { AsyncView, InitialAvatar, type Resource } from "@/shared/ui"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { MemberProgress } from "../domain/progress-types"
  import type { WatchItem } from "../domain/types"
  import OtherProgress from "./OtherProgress.svelte"
  import ProgressForm from "./ProgressForm.svelte"

  interface Props {
    item: WatchItem
    /** Loaded by the title page, which the header's rating shares. */
    progress: Resource<MemberProgress>
    /** Names for everyone with progress, including removed people still visible. */
    authors: readonly MemberRef[]
    onSaved: () => void
  }

  let { item, progress, authors, onSaved }: Props = $props()
</script>

<!-- D03a "Your place in the story": your own form beside everyone else's place, read-only. -->
<Card.Root role="region" aria-labelledby="progress-heading">
  <Card.Header>
    <Card.Title id="progress-heading">Your place in the story</Card.Title>
    <Card.Description>Personal progress. It does not change your together history.</Card.Description
    >
  </Card.Header>
  <Card.Content>
    <AsyncView resource={progress}>
      {#snippet children(state)}
        {@const others = state.entries.filter((p) => p.userId !== state.me)}
        <div class="grid gap-columns md:grid-cols-2 md:divide-x md:divide-border">
          <div class="flex flex-col gap-stack md:pr-columns">
            <div class="flex items-center gap-item">
              <InitialAvatar
                name={memberName(authors, state.me)}
                size="sm"
                tone="brand"
                decorative
              />
              <span class="type-label text-foreground">You</span>
            </div>
            <ProgressForm
              itemId={item.id}
              episodic={item.mediaType !== "movie"}
              mine={state.entries.find((p) => p.userId === state.me) ?? null}
              {onSaved}
            />
          </div>
          {#if others.length === 0}
            <p class="type-sm text-muted-foreground">Nobody else has started this one yet.</p>
          {:else}
            <ul class="flex flex-col gap-section" aria-label="Everyone else">
              {#each others as entry (entry.userId)}
                <OtherProgress {entry} name={memberName(authors, entry.userId)} />
              {/each}
            </ul>
          {/if}
        </div>
      {/snippet}
    </AsyncView>
  </Card.Content>
</Card.Root>
