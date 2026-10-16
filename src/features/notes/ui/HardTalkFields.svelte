<script lang="ts">
  import { I_TIP } from "../domain"
  import type { ComposerState } from "./composer-state.svelte"
  import FeelingWords from "./FeelingWords.svelte"
  import HardTalkSection from "./HardTalkSection.svelte"
  import ResponseWishPicker from "./ResponseWishPicker.svelte"
  import SupportChips from "./SupportChips.svelte"
  import TipOnce from "./TipOnce.svelte"

  let { composer }: { composer: ComposerState } = $props()
  let feel = $state<HTMLTextAreaElement | null>(null)
</script>

<TipOnce storageKey="cg.notes.iTip" text={I_TIP} />
<HardTalkSection key="happened" bind:value={composer.body} />
<HardTalkSection key="feel" bind:value={composer.sections.feel} bind:ref={feel}>
  <FeelingWords bind:value={composer.sections.feel} target={feel} />
</HardTalkSection>
<HardTalkSection key="matters" bind:value={composer.sections.matters} />
<HardTalkSection key="help" bind:value={composer.sections.help}>
  <SupportChips bind:value={composer.supportWish} />
</HardTalkSection>
<ResponseWishPicker bind:value={composer.responseWish} />
