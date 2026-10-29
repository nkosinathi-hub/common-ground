<script lang="ts">
  import type { Snippet } from "svelte"
  import * as Tabs from "$lib/components/ui/tabs"
  import type { MemberRef } from "@/shared/domain"
  import type { Resource } from "@/shared/ui"
  import type { WatchItem } from "../domain/types"
  import EpisodeList from "./EpisodeList.svelte"
  import ItemAvailability from "./ItemAvailability.svelte"
  import ProgressPanel from "./ProgressPanel.svelte"
  import SessionsPanel from "./SessionsPanel.svelte"

  interface Props {
    spaceId: string
    item: WatchItem
    people: Resource<MemberRef[]>
    names: Resource<MemberRef[]>
    version: number
    wide: boolean
    onchanged: () => void
    /** The next episode and the player (D03a "Next up"). */
    playing: Snippet
    discussion: Snippet
  }

  let { spaceId, item, people, names, version, wide, onchanged, playing, discussion }: Props =
    $props()
  const authors = $derived(names.value ?? people.value ?? [])
</script>

{#snippet progress()}
  <ProgressPanel {item} {authors} {version} onSaved={onchanged} />
{/snippet}
{#snippet together()}
  <SessionsPanel {item} members={people.value ?? []} {authors} onLogged={onchanged} />
{/snippet}

{#if wide}
  <!-- D03a: the story and your place in it, beside what you shared and where to watch. -->
  <Tabs.Content
    value="progress"
    class="grid gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]"
  >
    <div class="flex min-w-0 flex-col gap-stack">{@render playing()}{@render progress()}</div>
    <div class="flex min-w-0 flex-col gap-stack">
      {@render together()}<ItemAvailability {spaceId} {item} />
    </div>
  </Tabs.Content>
{:else}
  <Tabs.Content value="overview" class="flex flex-col gap-stack"
    ><ItemAvailability {spaceId} {item} /></Tabs.Content
  >
  <Tabs.Content value="episodes" class="flex flex-col gap-stack">
    {#if item.mediaType !== "movie"}<EpisodeList {item} names={authors} />{/if}
    {@render playing()}
  </Tabs.Content>
  <Tabs.Content value="progress" class="flex flex-col gap-stack"
    >{@render progress()}{@render together()}</Tabs.Content
  >
{/if}
<Tabs.Content value="discussion">{@render discussion()}</Tabs.Content>
