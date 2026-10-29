<script lang="ts">
  import { Ellipsis, Pencil, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { ConfirmDialog } from "@/shared/ui"

  interface Props {
    author: string
    canEdit: boolean
    canDelete: boolean
    onEdit: () => void
    onDelete: () => Promise<void>
  }

  let { author, canEdit, canDelete, onEdit, onDelete }: Props = $props()
  let confirming = $state(false)
</script>

<!-- Editing and deleting are rare, so they wait in the comment's menu (the rows stay quiet). -->
{#if canEdit || canDelete}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon-sm" aria-label="More for comment by {author}">
          <Ellipsis />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#if canEdit}
        <DropdownMenu.Item onSelect={onEdit}><Pencil aria-hidden="true" />Edit</DropdownMenu.Item>
      {/if}
      {#if canDelete}
        <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
          <Trash2 aria-hidden="true" />Delete comment
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <ConfirmDialog
    bind:open={confirming}
    title="Delete this comment?"
    description="It is removed for everyone in this space. This cannot be undone."
    confirmLabel="Delete"
    onConfirm={onDelete}
  />
{/if}
