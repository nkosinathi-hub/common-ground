<script lang="ts">
  import { Lock } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ConfirmDialog } from "@/shared/ui"
  import { SAVE_STATUS } from "../domain"
  import type { ComposerState } from "./composer.svelte"

  interface Props {
    composer: ComposerState
    /** Who it goes to, for the button; empty until someone is chosen. */
    name: string
    onDelete: () => void
  }

  let { composer, name, onDelete }: Props = $props()
  let confirming = $state(false)
</script>

<div class="flex flex-wrap items-center justify-end gap-2">
  <p
    role="status"
    class="mr-auto flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground"
    title="Only you can see this"
  >
    <Lock class="size-3" aria-hidden="true" /><span class="sr-only">Only you can see this.</span>
    {SAVE_STATUS[composer.autosave.status]}
  </p>
  {#if composer.autosave.id}
    <Button variant="ghost" class="min-h-11" onclick={() => (confirming = true)}
      >Delete draft</Button
    >
  {/if}
  <Button type="submit" class="min-h-11" disabled={composer.sending}
    >{name ? `Send to ${name}` : "Send"}</Button
  >
</div>
<ConfirmDialog
  bind:open={confirming}
  title="Delete this draft?"
  description="It can't be brought back."
  confirmLabel="Delete draft"
  onConfirm={onDelete}
/>
