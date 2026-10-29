<script lang="ts">
  import { SettingsSection } from "@/shared/ui"
  import { BACKGROUND_SWATCHES, BUTTON_SWATCHES, CARD_SWATCHES } from "../../domain/space-look"
  import type { LookDraft } from "./look-draft.svelte"
  import OptionTiles from "./OptionTiles.svelte"
  import SwatchGroup from "./SwatchGroup.svelte"
  import Thumb from "./Thumb.svelte"
  import type { Snippet } from "svelte"

  interface Props {
    draft: LookDraft
    picture: string | null
    /** The background picture field, shown when the style is Image. */
    imageField: Snippet
  }

  let { draft, picture, imageField }: Props = $props()
  const look = $derived(draft.look)
  const STYLES = [
    { value: "solid", label: "Solid" },
    { value: "gradient", label: "Gradient" },
    { value: "pattern", label: "Pattern" },
    { value: "image", label: "Image" },
  ] as const
  const SIDEBARS = [
    { value: "filled", label: "Filled" },
    { value: "light", label: "Light" },
  ] as const
</script>

<!-- D15b Colours and style (230:7932). -->
<SettingsSection
  id="look-colours"
  title="Colours"
  description="Text and icons adjust automatically to stay readable on any colour you pick."
>
  <SwatchGroup
    kind="background"
    label="Background"
    swatches={BACKGROUND_SWATCHES}
    value={look.background}
    {look}
    onchange={(hex) => draft.set("background", hex)}
  />
  <SwatchGroup
    kind="card"
    label="Cards"
    swatches={CARD_SWATCHES}
    value={look.card}
    {look}
    onchange={(hex) => draft.set("card", hex)}
  />
  <SwatchGroup
    kind="button"
    label="Buttons"
    swatches={BUTTON_SWATCHES}
    value={look.button}
    {look}
    onchange={(hex) => draft.set("button", hex)}
  />
</SettingsSection>
<SettingsSection
  id="look-style"
  title="Style"
  description="How the page background and the sidebar are drawn."
>
  <OptionTiles
    label="Background"
    options={STYLES}
    value={look.backgroundStyle}
    onchange={(value) => draft.set("backgroundStyle", value)}
  >
    {#snippet thumb(kind)}<Thumb {kind} {picture} />{/snippet}
  </OptionTiles>
  {#if look.backgroundStyle === "image"}{@render imageField()}{/if}
  <OptionTiles
    label="Sidebar"
    hint="Filled uses the button colour"
    options={SIDEBARS}
    value={look.sidebar}
    onchange={(value) => draft.set("sidebar", value)}
  >
    {#snippet thumb(kind)}<Thumb {kind} />{/snippet}
  </OptionTiles>
</SettingsSection>
