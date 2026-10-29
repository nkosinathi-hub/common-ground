<script lang="ts">
  import { Ellipsis, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { ConfirmDialog, toast, navigate } from "@/shared/ui"
  import type { WatchItemView } from "../domain/types"
  import { useWatch } from "./context"

  interface Props {
    view: WatchItemView
    backHref: string
  }

  let { view, backHref }: Props = $props()
  const { service } = useWatch()
  const item = $derived(view.item)
  let confirming = $state(false)

  async function remove() {
    const result = await service.remove(item.id)
    if (!result.ok) return toast.error(result.error.message)
    toast.success(`${item.title} was removed`)
    navigate(backHref)
  }
</script>

<!-- Deleting is rare and final, so it waits in the title's menu; editing lives on the note card. -->
{#if view.canDelete}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon-sm" aria-label="More for {item.title}">
          <Ellipsis />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Item variant="destructive" onSelect={() => (confirming = true)}>
        <Trash2 aria-hidden="true" />Delete
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}

<ConfirmDialog
  bind:open={confirming}
  title={`Delete ${item.title}?`}
  description="It leaves the shared list for everyone, with all progress and watched-together history."
  confirmLabel="Delete"
  onConfirm={remove}
/>
