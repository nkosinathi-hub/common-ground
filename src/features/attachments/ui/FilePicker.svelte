<script lang="ts">
  import { Paperclip, Upload } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ACCEPT, formatBytes, BYTES_MAX } from "../domain/rules"

  interface Props {
    disabled: boolean
    onPick: (file: File) => void
  }
  let { disabled, onPick }: Props = $props()

  let input = $state<HTMLInputElement | null>(null)

  function picked(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (file) onPick(file)
  }
</script>

<div class="flex items-center justify-between gap-2">
  <h3 class="flex items-center gap-2 text-sm font-semibold">
    <Paperclip class="size-4" aria-hidden="true" />Attachments
  </h3>
  <Button size="sm" variant="secondary" {disabled} onclick={() => input?.click()}>
    <Upload aria-hidden="true" />Attach a file
  </Button>
  <input
    bind:this={input}
    type="file"
    class="sr-only"
    tabindex={-1}
    accept={ACCEPT}
    aria-label="Choose a file to attach"
    onchange={picked}
  />
</div>
<!-- Convenience hint only: the Edge Function re-checks type, size and the file's real bytes. -->
<p class="text-xs text-muted-foreground">
  JPEG, PNG, WebP or PDF, up to {formatBytes(BYTES_MAX)}. Files are checked again after upload.
</p>
