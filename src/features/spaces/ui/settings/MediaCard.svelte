<script lang="ts">
  import { SettingsSection, toast } from "@/shared/ui"
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

<!-- Figma D15a Pictures: the space picture, then the cover. -->
<SettingsSection
  id="settings-pictures"
  title="Pictures"
  description="A picture and a cover make the space easy to recognise."
>
  <ImageUpload
    kind="avatar"
    icon={space.icon}
    url={store.mediaUrl(space.avatarPath)}
    busy={busy === "avatar"}
    onPick={pick("avatar")}
    onRemove={remove("avatar")}
  />
  <ImageUpload
    kind="cover"
    url={store.mediaUrl(space.coverPath)}
    busy={busy === "cover"}
    onPick={pick("cover")}
    onRemove={remove("cover")}
  />
</SettingsSection>
