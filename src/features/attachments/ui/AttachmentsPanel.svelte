<script lang="ts">
  import { canDelete } from "@/shared/domain"
  import { untrack } from "svelte"
  import { AsyncView, Resource, toast } from "@/shared/ui"
  import type { Attachment } from "../domain/types"
  import AttachmentItem from "./AttachmentItem.svelte"
  import { useAttachments } from "./context"
  import FilePicker from "./FilePicker.svelte"
  import { UploadState } from "./upload-state.svelte"
  import UploadStatus from "./UploadStatus.svelte"

  interface Props {
    spaceId: string
    ideaId: string
    me: string
    isOwner: boolean
  }
  let { spaceId, ideaId, me, isOwner }: Props = $props()

  const { service } = useAttachments()
  const list = new Resource(() => service.list(spaceId, ideaId))
  $effect(() => {
    void [spaceId, ideaId]
    untrack(() => void list.load())
  })
  const upload = new UploadState(
    service,
    () => ({ spaceId, ideaId }),
    () => void list.load(),
  )

  async function remove({ id, filename }: Attachment) {
    const result = await service.remove(id)
    if (!result.ok) return toast.error(result.error.message)
    toast.success(`${filename} was deleted`)
    await list.load()
  }
</script>

<section class="space-y-3" aria-label="Attachments">
  <FilePicker disabled={upload.busy} onPick={(file) => void upload.upload(file)} />

  {#if upload.error}
    <div role="alert" class="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
      {upload.error.message}
    </div>
  {/if}
  {#if upload.busy}<UploadStatus {upload} />{/if}

  <AsyncView resource={list}>
    {#snippet children(items)}
      {#if items.length === 0}
        <p class="py-4 text-center text-xs text-muted-foreground">No files attached yet.</p>
      {:else}
        <ul class="divide-y">
          {#each items as attachment (attachment.id)}
            <AttachmentItem
              {attachment}
              deletable={canDelete(attachment.uploaderId, { me, isOwner })}
              onDelete={remove}
            />
          {/each}
        </ul>
      {/if}
    {/snippet}
  </AsyncView>
</section>
