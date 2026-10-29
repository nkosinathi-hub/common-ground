<script lang="ts">
  import { Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ConfirmDialog } from "@/shared/ui"

  let { onDelete }: { onDelete: () => Promise<void> } = $props()
  let confirming = $state(false)
</script>

<!-- S06d "Delete event…": at the editor's footer start, confirmed before anything goes. -->
<Button variant="ghost" class="text-destructive" onclick={() => (confirming = true)}>
  <Trash2 aria-hidden="true" />Delete event…
</Button>
<ConfirmDialog
  bind:open={confirming}
  title="Delete this event?"
  description="Everyone invited loses it from their calendar. This cannot be undone."
  confirmLabel="Delete"
  onConfirm={onDelete}
/>
