<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import type { AppError, Cursor } from "@/shared/domain"
  import {
    canDelete,
    LINK_DESCRIPTION_MAX,
    LINK_TITLE_MAX,
    URL_MAX,
    type Idea,
    type Viewer,
    type LinkInput,
    type ResearchLink,
  } from "../domain"
  import { PagedList } from "@/shared/ui"
  import { useResearch } from "./context"
  import LinkItem from "./LinkItem.svelte"
  import ListFooter from "./ListFooter.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
  }

  const EMPTY: LinkInput = { url: "", title: "", description: "" }

  let { idea, viewer }: Props = $props()
  const research = useResearch().service
  const list = new PagedList<ResearchLink, Cursor>((after) => research.links(idea.id, after))
  // Loads on mount and when the idea id changes; edits to the idea replace the prop, not the id.
  const ideaId = $derived(idea.id)
  $effect(() => {
    void ideaId
    untrack(() => list.load())
  })

  let draft = $state<LinkInput>({ ...EMPTY })
  let error = $state<AppError | null>(null)

  async function add(event: SubmitEvent) {
    event.preventDefault()
    error = await list.add(research.addLink(idea.spaceId, idea.id, draft))
    if (!error) draft = { ...EMPTY }
  }
  async function remove(id: string) {
    error = await list.remove(id, research.removeLink(id))
  }
  const invalid = (field: string) => (error?.field === field ? true : undefined)
</script>

<section aria-labelledby="links-heading" class="flex flex-col gap-3">
  <h2 id="links-heading" class="text-lg font-semibold">Research links</h2>
  <form class="grid gap-2 sm:grid-cols-2" onsubmit={add}>
    <Input
      aria-label="Link URL"
      type="url"
      placeholder="https://"
      maxlength={URL_MAX}
      bind:value={draft.url}
      aria-invalid={invalid("url")}
    />
    <Input
      aria-label="Link title"
      placeholder="Title"
      maxlength={LINK_TITLE_MAX}
      bind:value={draft.title}
      aria-invalid={invalid("title")}
    />
    <Input
      aria-label="Link description"
      class="sm:col-span-2"
      placeholder="Why it matters (optional)"
      maxlength={LINK_DESCRIPTION_MAX}
      bind:value={draft.description}
    />
    {#if error}<p class="text-sm text-destructive sm:col-span-2" role="alert">
        {error.message}
      </p>{/if}
    <Button type="submit" size="sm" class="self-start">Add link</Button>
  </form>
  <ul class="flex flex-col gap-2">
    {#each list.items as link (link.id)}
      <LinkItem
        {link}
        deletable={canDelete(link.createdBy, viewer)}
        onRemove={() => remove(link.id)}
      />
    {/each}
  </ul>
  <ListFooter {list} empty="No links yet." />
</section>
