<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Link } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import * as Card from "$lib/components/ui/card"
  import { type AppError, canDelete, type Cursor, type Viewer } from "@/shared/domain"
  import {
    LINK_DESCRIPTION_MAX,
    LINK_TITLE_MAX,
    URL_MAX,
    type Idea,
    type LinkInput,
    type ResearchLink,
  } from "../domain"
  import { FormError, FormField, PagedList, PhoneAdd } from "@/shared/ui"
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
    untrack(() => void list.load())
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
</script>

<!-- D07 Research links: each with its site and why it matters, then a short form to add one. -->
<Card.Root role="region" aria-labelledby="links-heading">
  <Card.Header>
    <Card.Title id="links-heading">Research links</Card.Title>
    {#if list.items.length}<Card.Action
        ><Badge variant="outline">{list.items.length}</Badge></Card.Action
      >{/if}
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    <ul class="flex flex-col divide-y divide-border">
      {#each list.items as link (link.id)}
        <LinkItem
          {link}
          deletable={canDelete(link.createdBy, viewer)}
          onRemove={() => remove(link.id)}
        />
      {/each}
    </ul>
    <ListFooter {list} empty="No links yet." />
    <PhoneAdd label="Add link">
      <form class="flex flex-col gap-stack border-t border-border pt-stack" onsubmit={add}>
        <FormField
          id="link-url"
          maxlength={URL_MAX}
          label="URL"
          type="url"
          icon={Link}
          bind:value={draft.url}
          error={error?.field === "url" ? error.message : undefined}
        />
        <FormField
          id="link-title"
          maxlength={LINK_TITLE_MAX}
          label="Title"
          bind:value={draft.title}
          error={error?.field === "title" ? error.message : undefined}
        />
        <FormField
          id="link-description"
          maxlength={LINK_DESCRIPTION_MAX}
          label="Description (optional)"
          required={false}
          bind:value={draft.description}
        />
        <FormError message={error && !error.field ? error.message : null} />
        <Button type="submit" class="self-start" disabled={!draft.url.trim()}>Add link</Button>
      </form>
    </PhoneAdd>
  </Card.Content>
</Card.Root>
