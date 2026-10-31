<script lang="ts">
  import { Ellipsis, SquarePen, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { canDelete, type Viewer } from "@/shared/domain"
  import { ConfirmDialog } from "@/shared/ui"
  import type { Idea } from "../domain"
  import IdeaDetailsDialog from "./IdeaDetailsDialog.svelte"

  interface Props {
    idea: Idea
    viewer: Viewer
    onChange: (idea: Idea) => void
    onDelete: () => Promise<void>
  }

  let { idea, viewer, onChange, onDelete }: Props = $props()
  let editing = $state(false)
  let confirming = $state(false)
</script>

<!-- Renaming and deleting are rare, so they wait in the idea's menu rather than on the page. -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="icon" aria-label="More for {idea.title}">
        <Ellipsis />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onSelect={() => (editing = true)}>
      <SquarePen aria-hidden="true" />Edit details
    </DropdownMenu.Item>
    {#if canDelete(idea.createdBy, viewer)}
      <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
        <Trash2 aria-hidden="true" />Delete idea
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>

<IdeaDetailsDialog bind:open={editing} {idea} {onChange} />
<ConfirmDialog
  bind:open={confirming}
  title="Delete this idea?"
  description="Its notes, links, tasks, budget and discussion go with it. This cannot be undone."
  confirmLabel="Delete"
  onConfirm={onDelete}
/>
