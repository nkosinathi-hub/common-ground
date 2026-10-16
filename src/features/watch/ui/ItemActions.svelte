<script lang="ts">
  import type { Snippet } from "svelte"
  import { Pencil, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ConfirmDialog, toast, navigate } from "@/shared/ui"
  import type { WatchItemView } from "../domain/types"
  import { useWatch } from "./context"
  import EditTitleDialog from "./EditTitleDialog.svelte"

  interface Props {
    view: WatchItemView
    backHref: string
    recommend?: Snippet
    onChanged: () => void
  }

  let { view, backHref, recommend, onChanged }: Props = $props()
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

<div class="flex flex-wrap gap-2">
  <Button variant="outline" size="sm" onclick={() => (editing = true)}>
    <Pencil aria-hidden="true" />
    Edit details
  </Button>
  {#if view.canDelete}
    <Button variant="ghost" size="sm" class="text-destructive" onclick={() => (confirming = true)}>
      <Trash2 aria-hidden="true" />
      Delete
    </Button>
  {/if}
  {@render recommend?.()}
</div>

<EditTitleDialog bind:open={editing} {item} onSaved={onChanged} />
<ConfirmDialog
  bind:open={confirming}
  title={`Delete ${item.title}?`}
  description="It leaves the shared list for everyone, with all progress and watched-together history."
  confirmLabel="Delete"
  onConfirm={remove}
/>
