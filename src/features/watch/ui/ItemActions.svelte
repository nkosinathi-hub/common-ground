<script lang="ts">
  import { Ellipsis, Pencil, Trash2 } from "@lucide/svelte"
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
  let editing = $state(false)
  let confirming = $state(false)

  async function remove() {
    const result = await service.remove(item.id)
    if (!result.ok) return toast.error(result.error.message)
    toast.success(`${item.title} was removed`)
    navigate(backHref)
  }
</script>

<!-- The title's own actions, in its menu: editing the details and deleting it. -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon-sm" aria-label="More for {item.title}">
        <Ellipsis />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onSelect={() => (editing = true)}>
      <Pencil aria-hidden="true" />Edit details
    </DropdownMenu.Item>
    {#if view.canDelete}
      <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
        <Trash2 aria-hidden="true" />Delete
      </DropdownMenu.Item>
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>

<EditTitleDialog bind:open={editing} {item} onSaved={onChanged} />
<ConfirmDialog
  bind:open={confirming}
  title={`Delete ${item.title}?`}
  description="It leaves the shared list for everyone, with all progress and watched-together history."
  confirmLabel="Delete"
  onConfirm={remove}
/>
