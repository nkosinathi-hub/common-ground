<script lang="ts">
  import { untrack } from "svelte"
  import { mode } from "mode-watcher"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { FormError, FormState } from "@/shared/ui"
  import { lookOf, type SpacePreset } from "../../domain/look"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import AccentPicker from "./AccentPicker.svelte"
  import PresetPicker from "./PresetPicker.svelte"
  import { saveAndRefresh } from "./save"

  interface Props {
    space: Space
  }

  let { space }: Props = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  let theme = $state<SpacePreset | null>(untrack(() => space.theme))
  let accent = $state<string | null>(untrack(() => space.accent))
  const colourMode = $derived(mode.current === "dark" ? "dark" : "light")
  const preview = $derived(lookOf({ theme, accent, template: space.template }, colourMode))
  const previewStyle = $derived(
    Object.entries(preview.vars)
      .map(([name, value]) => `${name}: ${value}`)
      .join("; "),
  )

  async function save(event: SubmitEvent) {
    event.preventDefault()
    await saveAndRefresh(form, store, () => service.profile.saveLook(space.id, { theme, accent }))
  }
</script>

<Card.Root id="settings-look" tabindex={-1}>
  <Card.Header>
    <Card.Title>Look</Card.Title>
    <Card.Description>Everyone in the space sees these colours.</Card.Description>
  </Card.Header>
  <Card.Content>
    <form class="grid gap-4" onsubmit={save} novalidate>
      <PresetPicker bind:value={theme} template={space.template} />
      <AccentPicker bind:value={accent} mode={colourMode} />
      <div
        data-testid="look-preview"
        data-space-theme={preview.preset}
        style={previewStyle}
        class="flex items-center gap-3 rounded-lg bg-secondary p-3"
      >
        <span class="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground">Preview</span>
        <span class="text-sm font-medium text-primary">How links and buttons look</span>
      </div>
      <FormError message={form.formError} />
      <Button type="submit" class="w-fit" disabled={form.pending}>Save look</Button>
    </form>
  </Card.Content>
</Card.Root>
