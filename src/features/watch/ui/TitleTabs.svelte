<script lang="ts">
  import type { Snippet } from "svelte"
  import * as Tabs from "$lib/components/ui/tabs"
  import type { MemberRef } from "@/shared/domain"
  import type { Resource } from "@/shared/ui"
  import type { MemberProgress } from "../domain/progress-types"
  import type { WatchItem } from "../domain/types"
  import AvailabilityNote from "./AvailabilityNote.svelte"
  import EpisodeList from "./EpisodeList.svelte"
  import ItemAvailability from "./ItemAvailability.svelte"
  import ProgressPanel from "./ProgressPanel.svelte"
  import SessionsPanel from "./SessionsPanel.svelte"

  interface Props {
    spaceId: string
    item: WatchItem
    people: Resource<MemberRef[]>
    names: Resource<MemberRef[]>
    progress: Resource<MemberProgress>
    wide: boolean
    onchanged: () => void
    /** Reloads the title itself, after its details or note change. */
    onedited: () => void
    /** The next episode and the player (D03a "Next up"). */
    playing: Snippet
    discussion: Snippet
  }

  let {
    spaceId,
    item,
    people,
    names,
    progress,
    wide,
    onchanged,
    onedited,
    playing,
    discussion,
  }: Props = $props()
  const authors = $derived(names.value ?? people.value ?? [])
  const together = $derived(progress.value?.together ?? null)
  const grid = "grid gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]"
  const column = "flex min-w-0 flex-col gap-stack"
</script>

{#snippet place()}
  <ProgressPanel {item} {progress} {authors} onSaved={onchanged} />
{/snippet}
{#snippet sessions()}
  <SessionsPanel {item} {together} members={people.value ?? []} {authors} onLogged={onchanged} />
{/snippet}
{#snippet note()}<AvailabilityNote {item} onChanged={onedited} />{/snippet}

{#if wide}
  <!-- D03a: what plays next and your place, beside what you shared and where to watch. -->
  <Tabs.Content value="progress" class={grid}>
    <div class={column}>{@render playing()}{@render place()}</div>
    <div class={column}>
      {@render sessions()}<ItemAvailability {spaceId} {item} onChanged={onedited} />
    </div>
  </Tabs.Content>
  <!-- D03b: the conversation beside the space's own availability note. -->
  <Tabs.Content value="discussion" class={grid}>
    <div class={column}>{@render discussion()}</div>
    <div class={column}>{@render note()}</div>
  </Tabs.Content>
{:else}
  <Tabs.Content value="overview" class={column}>
    {#if item.catalog}<ItemAvailability {spaceId} {item} onChanged={onedited} />{/if}
    {@render note()}
  </Tabs.Content>
  <Tabs.Content value="episodes" class={column}>
    {#if item.mediaType !== "movie"}<EpisodeList {item} names={authors} />{/if}
    {@render playing()}
  </Tabs.Content>
  <Tabs.Content value="progress" class={column}>{@render place()}{@render sessions()}</Tabs.Content>
  <Tabs.Content value="discussion" class={column}>{@render discussion()}</Tabs.Content>
{/if}
