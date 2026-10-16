<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { toast } from "@/shared/ui"
  import type { Result } from "@/shared/domain"
  import type { MediaSlot } from "../../domain/media"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import { resizeImage } from "../resize-image"
  import ImageUpload from "./ImageUpload.svelte"

  interface Props {
    space: Space
  }

  let { space }: Props = $props()
  const { service, store } = useSpaces()
  let busy = $state<MediaSlot | null>(null)

  async function run(slot: MediaSlot, action: () => Promise<Result<unknown>>, done: string) {
    busy = slot
    try {
      const result = await action()
      if (!result.ok) return void toast.error(result.error.message)
      toast.success(done)
      await store.refresh()
    } catch {
      toast.error("That picture could not be read. Try a JPEG, PNG or WebP file.")
    } finally {
      busy = null
    }
  }

  const pick = (slot: MediaSlot) => (file: File) =>
    run(
      slot,
      async () => service.profile.replaceMedia(space.id, slot, await resizeImage(file, slot)),
      "Picture saved",
    )
  const remove = (slot: MediaSlot) => () =>
    run(slot, () => service.profile.clearMedia(space.id, slot), "Picture removed")
</script>

<Card.Root id="settings-pictures" tabindex={-1}>
  <Card.Header>
    <Card.Title>Pictures</Card.Title>
    <Card.Description>
      Pictures are cropped and saved again without their metadata, such as location.
    </Card.Description>
  </Card.Header>
  <Card.Content class="grid gap-6 sm:grid-cols-[auto_1fr]">
    <ImageUpload
      kind="avatar"
      label="Picture"
      url={store.mediaUrl(space.avatarPath)}
      busy={busy === "avatar"}
      onPick={pick("avatar")}
      onRemove={remove("avatar")}
    />
    <ImageUpload
      kind="cover"
      label="Cover"
      url={store.mediaUrl(space.coverPath)}
      busy={busy === "cover"}
      onPick={pick("cover")}
      onRemove={remove("cover")}
    />
  </Card.Content>
</Card.Root>
