<script lang="ts">
  import { mode } from "mode-watcher"
  import * as Alert from "$lib/components/ui/alert"
  import { Button } from "$lib/components/ui/button"
  import * as Tabs from "$lib/components/ui/tabs"
  import { FormError, FormState, toast } from "@/shared/ui"
  import { paletteFor } from "../../domain/palette"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import { resizeImage } from "../resize-image"
  import { saveAndRefresh } from "../settings/save"
  import BackgroundImageField from "./BackgroundImageField.svelte"
  import ColourSections from "./ColourSections.svelte"
  import LayoutSections from "./LayoutSections.svelte"
  import { LookDraft } from "./look-draft.svelte"
  import LookPreview from "./LookPreview.svelte"

  let { space }: { space: Space } = $props()
  const { service, store } = useSpaces()
  const draft = new LookDraft(() => space.look)
  const form = new FormState()
  let uploading = $state(false)
  const picture = $derived(store.mediaUrl(space.backgroundPath))
  const scheme = $derived(mode.current === "dark" ? "dark" : "light")
  const adjusted = $derived(paletteFor(draft.look, scheme).adjusted)

  async function upload(file: File) {
    uploading = true
    try {
      const blob = await resizeImage(file, "background")
      const result = await service.profile.replaceMedia(space.id, "background", blob)
      if (!result.ok) return void toast.error(result.error.message)
      await store.refresh()
    } catch {
      toast.error("That picture could not be read. Try a JPEG, PNG or WebP file.")
    } finally {
      uploading = false
    }
  }
  async function removePicture() {
    const result = await service.profile.clearMedia(space.id, "background")
    if (!result.ok) return void toast.error(result.error.message)
    draft.set("backgroundStyle", "solid")
    await store.refresh()
  }
  const save = () =>
    saveAndRefresh(form, store, () => service.profile.saveLook(space.id, draft.look))
</script>

<div class="grid gap-columns lg:grid-cols-[minmax(0,1fr)_var(--measure-aside)]">
  <Tabs.Root value="colours" class="flex min-w-0 flex-col gap-stack">
    <Tabs.List aria-label="Look and feel groups">
      <Tabs.Trigger value="colours">Colours and style</Tabs.Trigger>
      <Tabs.Trigger value="layout">Layout and type</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="colours" class="flex flex-col gap-stack">
      <ColourSections {draft} {picture}>
        {#snippet imageField()}
          <BackgroundImageField
            {picture}
            focusX={draft.look.focusX}
            focusY={draft.look.focusY}
            busy={uploading}
            onfile={upload}
            onremove={removePicture}
            onfocus={(x, y) => (draft.look = { ...draft.look, focusX: x, focusY: y })}
          />
        {/snippet}
      </ColourSections>
    </Tabs.Content>
    <Tabs.Content value="layout" class="flex flex-col gap-stack"
      ><LayoutSections {draft} /></Tabs.Content
    >
  </Tabs.Root>
  <aside class="flex flex-col gap-stack self-start lg:sticky lg:top-6" aria-label="Preview">
    <h2 class="type-label">Preview</h2>
    <LookPreview look={draft.look} name={space.name} {picture} />
    {#if adjusted.length}
      <Alert.Root variant="secondary">
        <Alert.Description>
          {adjusted.includes("button")
            ? "The button colour was deepened"
            : "A surface was lightened"} slightly so text stays readable.
        </Alert.Description>
      </Alert.Root>
    {/if}
    <FormError message={form.formError} />
    <div class="flex justify-end gap-related">
      <Button variant="outline" onclick={() => draft.reset()}>Reset to defaults</Button>
      <Button disabled={form.pending || !draft.dirty} onclick={save}>Save changes</Button>
    </div>
  </aside>
</div>
