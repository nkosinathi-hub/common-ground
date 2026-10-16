<script lang="ts">
  import { AttachmentsPanel } from "@/features/attachments"
  import { useAuth } from "@/features/auth"
  import { CommentThread } from "@/features/comments"
  import { IdeaDetail, IdeasPage } from "@/features/ideas"
  import type { Space } from "@/features/spaces"
  import { useWatch } from "@/features/watch"
  import { buildHash, type IdeaTab } from "@/shared/domain"
  import { Resource } from "@/shared/ui"

  let { space, ideaId, tab }: { space: Space; ideaId: string | null; tab: IdeaTab } = $props()
  const { session } = useAuth()
  const { members } = useWatch()
  const people = new Resource(() => members.members(space.id))
  $effect(() => void people.load())
  const me = $derived(session.user?.id ?? "")
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
