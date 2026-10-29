<script lang="ts">
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { SettingsSection } from "@/shared/ui"
  import type { Density } from "../../domain/space-look"
  import type { LookDraft } from "./look-draft.svelte"
  import OptionTiles from "./OptionTiles.svelte"
  import Thumb from "./Thumb.svelte"

  let { draft }: { draft: LookDraft } = $props()
  const CORNERS = [
    { value: "square", label: "Square" },
    { value: "soft", label: "Soft" },
    { value: "rounded", label: "Rounded" },
  ] as const
  const HEADINGS = [
    { value: "serif", label: "Serif" },
    { value: "sans", label: "Sans" },
  ] as const
</script>

<!-- D15b Layout and type (230:8397). -->
<SettingsSection
  id="look-layout"
  title="Layout"
  description="Spacing and corner shape across the whole app."
>
  <div class="flex flex-col gap-related">
    <span class="type-label" id="density-label">Density</span>
    <ToggleGroup.Root
      type="single"
      variant="segment"
      spacing={1}
      aria-labelledby="density-label"
      value={draft.look.density}
      onValueChange={(value) => value && draft.set("density", value as Density)}
      class="max-w-form"
    >
      <ToggleGroup.Item value="compact">Compact</ToggleGroup.Item>
      <ToggleGroup.Item value="comfortable">Comfortable</ToggleGroup.Item>
      <ToggleGroup.Item value="spacious">Spacious</ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>
  <OptionTiles
    label="Corners"
    options={CORNERS}
    value={draft.look.corners}
    onchange={(value) => draft.set("corners", value)}
  >
    {#snippet thumb(kind)}<Thumb {kind} />{/snippet}
  </OptionTiles>
</SettingsSection>
<SettingsSection
  id="look-type"
  title="Type"
  description="Body text stays in Inter for easy reading."
>
  <OptionTiles
    label="Headings"
    options={HEADINGS}
    value={draft.look.headings}
    onchange={(value) => draft.set("headings", value)}
  >
    {#snippet thumb(kind)}<Thumb {kind} />{/snippet}
  </OptionTiles>
</SettingsSection>
