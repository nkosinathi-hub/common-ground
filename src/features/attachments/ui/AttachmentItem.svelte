<script lang="ts">
  import { Download, FileText } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { DeleteButton } from "@/shared/ui"
  import { formatBytes, kindOf } from "../domain/rules"
  import type { Attachment } from "../domain/types"
  import { useAttachments } from "./context"
  import { openUrl } from "./open-url"

  interface Props {
    attachment: Attachment
    deletable: boolean
    onDelete: (attachment: Attachment) => unknown
  }
  let { attachment, deletable, onDelete }: Props = $props()

  const { service } = useAttachments()
  let preview = $state<string | null>(null)
  let failed = $state(false)
  // Bumped per attachment and on unmount, so a late URL never lands on the wrong item.
  let generation = 0
  let retried = false

  async function loadPreview(id: string) {
    const mine = generation
    const result = await service.signedUrl(id)
    if (mine !== generation) return
    if (result.ok) preview = result.value
    else failed = true
  }

  $effect(() => {
    const { id, mime } = attachment
    generation += 1
    retried = false
    preview = null
    failed = false
    if (kindOf(mime) === "image") void loadPreview(id)
    return () => (generation += 1)
  })

  /** Signed URLs expire; an image that stops loading gets one fresh URL. */
  function previewFailed() {
    if (retried) failed = true
    else void loadPreview(attachment.id)
    retried = true
  }

  async function download() {
    const result = await service.signedUrl(attachment.id, "attachment")
    if (result.ok) openUrl(result.value)
    else failed = true
  }
</script>

<li class="flex items-center gap-3 py-2">
  {#if kindOf(attachment.mime) === "image"}
    <div class="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
      {#if preview}
        <img
          src={preview}
          alt={attachment.filename}
          class="size-full object-cover"
          onerror={previewFailed}
        />
      {/if}
    </div>
  {:else}
    <div class="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">
      <FileText class="size-6 text-muted-foreground" aria-hidden="true" />
    </div>
  {/if}
  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium">{attachment.filename}</p>
    <p class="text-xs text-muted-foreground">{formatBytes(attachment.bytes)}</p>
    {#if failed}<p class="text-xs text-destructive">
        Could not open this file. Try again later.
      </p>{/if}
  </div>
  {#if kindOf(attachment.mime) === "pdf"}
    <Button
      size="sm"
      variant="ghost"
      onclick={download}
      aria-label={`Download ${attachment.filename}`}
    >
      <Download aria-hidden="true" />
    </Button>
  {/if}
  {#if deletable}
    <DeleteButton
      label={`Delete ${attachment.filename}`}
      what={attachment.filename}
      description="Everyone in this space loses access to it. This cannot be undone."
      onConfirm={() => onDelete(attachment)}
    />
  {/if}
</li>
