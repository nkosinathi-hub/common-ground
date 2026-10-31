<script lang="ts">
  import { untrack, type Snippet } from "svelte"
  import { ErrorState, Loading, Resource, navigate, pageTitle } from "@/shared/ui"
  import type { AppError, IdeaTab, Viewer } from "@/shared/domain"
  import { inSpace, type Idea } from "../domain"
  import { useIdeas } from "./context"
  import IdeaHeader from "./IdeaHeader.svelte"
  import IdeaTabContent from "./IdeaTabContent.svelte"
  import IdeaTabs from "./IdeaTabs.svelte"
  import InviteBanner from "./InviteBanner.svelte"

  interface Props {
    spaceId: string
    ideaId: string
    tab: IdeaTab
    tabHref: (tab: IdeaTab) => string
    /** The signed-in member; delete buttons show only for their own work, or to the owner. */
    viewer: Viewer
    /** Comments thread for this idea (collaboration feature). */
    discussion?: Snippet<[Idea]>
    /** Attachment list for the research tab (attachments feature). */
    attachments?: Snippet<[Idea]>
    /** At a glance rows from the tasks and budget features. */
    glance?: Snippet<[Idea]>
    /** After the idea is deleted; by default goes back to the space's ideas list. */
    onDeleted?: () => void
  }

  let { spaceId, ideaId, tab, tabHref, viewer, discussion, attachments, glance, onDeleted }: Props =
    $props()

  const ideas = useIdeas().service
  const people = new Resource(() => ideas.members(spaceId))
  const names = new Resource(() => ideas.authors(spaceId))
  let idea = $state<Idea | null>(null)
  let error = $state<AppError | null>(null)

  async function load() {
    const result = inSpace(await ideas.get(ideaId), spaceId)
    idea = result.ok ? result.value : null
    error = result.ok ? null : result.error
  }
  // Loads on mount and again when the idea changes.
  $effect(() => {
    void ideaId
    untrack(() => void load())
  })
  $effect(() => {
    void people.load()
    void names.load()
  })
  const authors = $derived(names.value ?? people.value ?? [])
  $effect(() => (idea ? pageTitle.show(idea.title) : undefined))

  const backToList = () => navigate({ name: "ideas", spaceId })
  const deleted = () => (onDeleted ?? backToList)()
  const changed = (next: Idea) => (idea = next)
</script>

{#if error}
  <ErrorState {error} onRetry={load} />
{:else if !idea}
  <Loading label="Loading idea" />
{:else}
  <div class="flex flex-col gap-4">
    <InviteBanner {idea} me={viewer.me} {authors} onAnswered={load} />
    <IdeaHeader
      {idea}
      {viewer}
      members={people.value ?? []}
      {authors}
      onChange={changed}
      onPeopleChanged={load}
      onDeleted={deleted}
    />
    <IdeaTabs current={tab} href={tabHref} />
    <IdeaTabContent
      {idea}
      {tab}
      {viewer}
      {discussion}
      {attachments}
      {glance}
      {authors}
      onChange={changed}
    />
  </div>
{/if}
