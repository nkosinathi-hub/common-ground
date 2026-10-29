<script lang="ts">
  import { canDelete } from "@/shared/domain"
  import { untrack } from "svelte"
  import * as Card from "$lib/components/ui/card"
  import { Dropzone, ErrorState, Resource, toast } from "@/shared/ui"
  import { ACCEPT, BYTES_MAX, formatBytes } from "../domain/rules"
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

<!-- D07 Attachments: an empty drop zone first; once files exist, the list and an attach button. -->
<Card.Root role="region" aria-label="Attachments">
  <Card.Header>
    <Card.Title>Attachments</Card.Title>
    {#if list.value?.length}
      <Card.Action
        ><FilePicker
          disabled={upload.busy}
          onPick={(file) => void upload.upload(file)}
        /></Card.Action
      >
    {/if}
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {#if upload.error}<p role="alert" class="type-sm text-destructive">
        {upload.error.message}
      </p>{/if}
    {#if upload.busy}<UploadStatus {upload} />{/if}
    {#if list.value?.length}
      <ul class="flex flex-col divide-y divide-border">
        {#each list.value as attachment (attachment.id)}
          <AttachmentItem
            {attachment}
            deletable={canDelete(attachment.uploaderId, { me, isOwner })}
            onDelete={remove}
          />
        {/each}
      </ul>
    {:else}
      <!-- Shown while the list loads too, so a file can be chosen straight away. -->
      <Dropzone
        title="No files yet"
        description="Keep maps, brochures or inspiration close to the idea."
        actionLabel="Choose a file"
        hint="JPEG, PNG, WebP or PDF, up to {formatBytes(BYTES_MAX)} each"
        accept={ACCEPT}
        inputLabel="Choose a file to attach"
        disabled={upload.busy}
        onfiles={([file]) => file && void upload.upload(file)}
      />
      {#if list.state.status === "error"}<ErrorState
          error={list.state.error}
          onRetry={() => list.load()}
        />{/if}
    {/if}
  </Card.Content>
</Card.Root>
