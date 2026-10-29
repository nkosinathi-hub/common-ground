<script lang="ts">
  import { Ellipsis, SquarePen, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { ConfirmDialog, toast, navigate } from "@/shared/ui"
  import type { WatchItemView } from "../domain/types"
  import { useWatch } from "./context"
  import EditTitleDialog from "./EditTitleDialog.svelte"

  interface Props {
    view: WatchItemView
    backHref: string
    onChanged: () => void
  }

  let { view, backHref, onChanged }: Props = $props()
  const { service } = useWatch()
  const item = $derived(view.item)
  let confirming = $state(false)
  let editing = $state(false)
  // Catalog titles keep the catalog's details; only a title added by hand is edited here.
  const editable = $derived(item.catalog === null)

  async function remove() {
    const result = await service.remove(item.id)
    if (!result.ok) return toast.error(result.error.message)
    toast.success(`${item.title} was removed`)
    navigate(backHref)
  }
</script>

<!-- Delete, and Edit for a title added by hand: rare, so they wait in the title's menu. -->
{#if view.canDelete || editable}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline" size="icon" aria-label="More for {item.title}">
          <Ellipsis />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#if editable}
        <DropdownMenu.Item onSelect={() => (editing = true)}>
          <SquarePen aria-hidden="true" />Edit details
        </DropdownMenu.Item>
      {/if}
      {#if view.canDelete}
        <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
          <Trash2 aria-hidden="true" />Delete
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}

{#if editable}<EditTitleDialog bind:open={editing} {item} onSaved={onChanged} />{/if}
<ConfirmDialog
  bind:open={confirming}
  title={`Delete ${item.title}?`}
  description="It leaves the shared list for everyone, with all progress and watched-together history."
  confirmLabel="Delete"
  onConfirm={remove}
/>
