<script lang="ts">
  import { Download, FileText, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { formatBytes, kindOf } from "../domain/rules"
  import type { Attachment } from "../domain/types"
  import { useAttachments } from "./context"
  import { openUrl } from "./open-url"

  let {
    attachment,
    deletable,
    onDelete,
  }: { attachment: Attachment; deletable: boolean; onDelete: (a: Attachment) => void } = $props()

  const service = useAttachments()
  let preview = $state<string | null>(null)
  let failed = $state(false)

  $effect(() => {
    if (kindOf(attachment.mime) !== "image") return
    void service.signedUrl(attachment.id).then((result) => {
      if (result.ok) preview = result.value
      else failed = true
    })
  })

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
        <img src={preview} alt={attachment.filename} class="size-full object-cover" />
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
    <Button
      size="sm"
      variant="ghost"
      class="text-destructive"
      aria-label={`Delete ${attachment.filename}`}
      onclick={() => onDelete(attachment)}
    >
      <Trash2 aria-hidden="true" />
    </Button>
  {/if}
</li>
