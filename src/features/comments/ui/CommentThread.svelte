<script lang="ts">
  import { untrack } from "svelte"
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import { memberName, type MemberRef } from "@/shared/domain"
  import type { ParentRef, Viewer } from "../domain/comment"
  import { hiddenNotice, type EpisodeContext } from "../domain/episodes"
  import ComposerPrompt from "./ComposerPrompt.svelte"
  import { useComments } from "./context"
  import EpisodeChips from "./EpisodeChips.svelte"
  import ThreadBody from "./ThreadBody.svelte"
  import { ThreadState } from "./thread-state.svelte"

  interface Props {
    spaceId: string
    parent: ParentRef
    me: string
    isOwner: boolean
    /** Current members, offered as mentions. */
    members: readonly MemberRef[]
    /** Names for authors and mentions; defaults to the current members. */
    authors?: readonly MemberRef[]
    /** A series: your place and your season's length, for the chips and spoiler gating. */
    episodes?: EpisodeContext | null
    title?: string
  }
  let {
    spaceId,
    parent,
    me,
    isOwner,
    members,
    authors,
    episodes = null,
    title = "Discussion",
  }: Props = $props()

  const { service } = useComments()
  const thread = $derived(new ThreadState(service, spaceId, parent, () => episodes))
  const viewer: Viewer = $derived({ me, isOwner, authors: authors ?? members })
  const name = $derived(memberName(viewer.authors, me))
  const notice = $derived(hiddenNotice(thread.hidden, viewer.authors))
  $effect(() => {
    void thread
    untrack(() => void thread.load())
  })
</script>

<!-- D03a/D03b discussion and D11: one card holding the conversation and the box to add to it. -->
<Card.Root role="region" aria-label="Comments">
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    <Card.Action class="max-w-full">
      {#if episodes && episodes.episodeCount > 0}
        <div class="hidden md:block">
          <EpisodeChips
            count={episodes.episodeCount}
            value={thread.chip}
            onchange={thread.choose}
          />
        </div>
      {:else if thread.items.length > 0}
        <Badge variant="outline"
          >{thread.items.length}{thread.list.hasMore ? "+" : ""}
          {thread.items.length === 1 && !thread.list.hasMore ? "comment" : "comments"}</Badge
        >
      {/if}
    </Card.Action>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {#if episodes && episodes.episodeCount > 0}
      <!-- Phones: the chips get their own row under the title (M03d). -->
      <div class="md:hidden">
        <EpisodeChips count={episodes.episodeCount} value={thread.chip} onchange={thread.choose} />
      </div>
    {/if}
    {#if episodes}
      <ComposerPrompt
        {members}
        {me}
        {name}
        episode={thread.chip === null ? null : `E${thread.chip}`}
        onSubmit={(draft) => thread.post(draft)}
      />
    {/if}
    <ThreadBody {thread} {viewer} {members} {me} {notice} tagged={episodes !== null} />
  </Card.Content>
</Card.Root>
