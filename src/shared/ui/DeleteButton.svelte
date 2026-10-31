<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Trash2 } from "@lucide/svelte"
  import ConfirmDialog from "./ConfirmDialog.svelte"

  interface Props {
    /** Accessible name of the button, e.g. "Delete note". */
    label: string
    /** Shown in the dialog title, e.g. "this note". */
    what: string
    description?: string
    onConfirm: () => unknown
  }

  let { label, what, description = "This cannot be undone.", onConfirm }: Props = $props()

  let open = $state(false)
</script>

<Button variant="ghost" size="icon-sm" aria-label={label} onclick={() => (open = true)}>
  <Trash2 />
</Button>
<ConfirmDialog
  bind:open
  title={`Delete ${what}?`}
  {description}
  confirmLabel="Delete"
  {onConfirm}
/>
