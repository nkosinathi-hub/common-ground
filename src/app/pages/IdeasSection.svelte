<script lang="ts">
  import { useMembers } from "../composition/members"
  import { AttachmentsPanel } from "@/features/attachments"
  import { CommentThread } from "@/features/comments"
  import { IdeaDetail, IdeasPage } from "@/features/ideas"
  import type { Space } from "@/features/spaces"
  import { buildHash, type IdeaTab } from "@/shared/domain"
  import { Resource } from "@/shared/ui"

  interface Props {
    space: Space
    /** The signed-in member's id. */
    me: string
    ideaId: string | null
    tab: IdeaTab
  }

  let { space, me, ideaId, tab }: Props = $props()
  const { members, authors } = useMembers()
  const people = new Resource(() => members.members(space.id))
  const names = new Resource(() => authors.authors(space.id))
  $effect(() => {
    void people.load()
    void names.load()
  })
  const isOwner = $derived(space.role === "owner")
  const ideaHref = (ideaId: string) =>
    buildHash({ name: "idea", spaceId: space.id, ideaId, tab: "overview" })
</script>

{#if ideaId}
  {#key ideaId}
    <IdeaDetail
      spaceId={space.id}
      {ideaId}
      {tab}
      viewer={{ me, isOwner }}
      tabHref={(next) => buildHash({ name: "idea", spaceId: space.id, ideaId, tab: next })}
    >
      {#snippet discussion(idea)}
        <CommentThread
          spaceId={space.id}
          parent={{ kind: "idea", id: idea.id }}
          {me}
          {isOwner}
          members={people.value ?? []}
          authors={names.value ?? people.value ?? []}
        />
      {/snippet}
      {#snippet attachments(idea)}
        <AttachmentsPanel spaceId={space.id} ideaId={idea.id} {me} {isOwner} />
      {/snippet}
    </IdeaDetail>
  {/key}
{:else}
  <IdeasPage spaceId={space.id} {me} {ideaHref} />
{/if}
