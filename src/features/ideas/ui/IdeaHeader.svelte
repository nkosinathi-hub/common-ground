<script lang="ts">
  import { ChevronLeft, Users } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { buildHash, memberName, type MemberRef, type Viewer } from "@/shared/domain"
  import { AvatarStack, FormError, TextLink } from "@/shared/ui"
  import { IDEA_STAGES, peopleOf, type Idea, type IdeaStage } from "../domain"
  import CollaboratorsDialog from "./CollaboratorsDialog.svelte"
  import { useIdeas } from "./context"
  import IdeaByline from "./IdeaByline.svelte"
  import IdeaMenu from "./IdeaMenu.svelte"
  import { STAGE_LABELS } from "./labels"

  interface Props {
    idea: Idea
    viewer: Viewer
    /** Current members, offered as collaborators. */
    members: readonly MemberRef[]
    /** Names for the byline, including removed people still visible. */
    authors: readonly MemberRef[]
    onChange: (idea: Idea) => void
    /** After invites or removals: the idea is reloaded with its people. */
    onPeopleChanged: () => void
    onDeleted: () => void
  }

  let { idea, viewer, members, authors, onChange, onPeopleChanged, onDeleted }: Props = $props()
  const ideas = useIdeas().service
  let error = $state<string | null>(null)
  let managing = $state(false)
  const people = $derived(
    peopleOf(idea).map((id) => ({ name: memberName(authors, id), me: id === viewer.me })),
  )
  const label = $derived(`On this idea: ${people.map((p) => p.name).join(", ")}`)

  async function moveStage(stage: IdeaStage) {
    const result = await ideas.moveStage(idea.id, stage)
    error = result.ok ? null : result.error.message
    if (result.ok) onChange(result.value)
  }
  /** Offered to the author and the owner only; a server refusal (a stale role) is shown here. */
  async function remove() {
    const result = await ideas.remove(idea.id)
    error = result.ok ? null : result.error.message
    if (result.ok) onDeleted()
  }
</script>

<!-- D06 to D11 idea header: back, the title, then stage, tags and people on one line. Phones keep
     M04's one row: stage, people and the menu; tags and the byline wait for a wider screen. -->
<header class="flex flex-col gap-stack">
  <TextLink
    href={buildHash({ name: "ideas", spaceId: idea.spaceId })}
    icon={ChevronLeft}
    class="w-fit flex-row-reverse">All ideas</TextLink
  >
  <h1 class="type-h1 text-foreground">{idea.title}</h1>
  <div class="flex flex-wrap items-center gap-x-item gap-y-related">
    <NativeSelect
      size="sm"
      aria-label="Stage"
      value={idea.stage}
      class="[&_select]:border-border [&_select]:type-label [&_select]:text-primary"
      onchange={(event) => moveStage(event.currentTarget.value as IdeaStage)}
    >
      {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option
        >{/each}
    </NativeSelect>
    {#if idea.tags.length > 0}
      <ul class="flex flex-wrap gap-related max-md:hidden" aria-label="Tags">
        {#each idea.tags as tag (tag)}<li><Badge variant="outline">{tag}</Badge></li>{/each}
      </ul>
    {/if}
    <div class="max-md:hidden"><IdeaByline {idea} {authors} /></div>
    <div class="ml-auto flex items-center gap-related">
      <AvatarStack {people} {label} />
      <Button
        variant="outline"
        class="max-md:size-10 max-md:px-0"
        onclick={() => (managing = true)}
      >
        <Users aria-hidden="true" /><span class="max-md:sr-only">Manage people</span>
      </Button>
      <IdeaMenu {idea} {viewer} {onChange} onDelete={remove} />
    </div>
  </div>
  <FormError message={error} />
</header>
{#if managing}
  <CollaboratorsDialog bind:open={managing} {idea} {members} onSaved={onPeopleChanged} />
{/if}
