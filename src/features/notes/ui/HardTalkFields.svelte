<script lang="ts">
  import { Lock, LockKeyhole } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import type { MemberRef } from "@/shared/domain"
  import { SelectField, ViewToggle } from "@/shared/ui"
  import { I_TIP, RESPONSE_WISHES, SUPPORT_WISHES } from "../domain"
  import type { ComposerState } from "./composer-state.svelte"
  import FeelingChips from "./FeelingChips.svelte"
  import HardTalkSection from "./HardTalkSection.svelte"
  import RecipientField from "./RecipientField.svelte"

  interface Props {
    composer: ComposerState
    members: readonly MemberRef[]
    /** 1 what happened, 2 how I feel, 3 what I need (S02a to S02c). */
    step: number
    name: string
  }

  let { composer, members, step, name }: Props = $props()
</script>

{#if step === 1}
  <div class="flex flex-col gap-stack sm:flex-row sm:items-end">
    <RecipientField bind:value={composer.to} {members} direct />
    <p class="flex min-h-10 items-center gap-related type-sm text-muted-foreground">
      <LockKeyhole class="size-4 shrink-0" aria-hidden="true" />Private until you send it. Every
      part is optional.
    </p>
  </div>
  <h3 class="type-h3 text-foreground">What happened</h3>
  <HardTalkSection key="happened" bind:value={composer.body} hint={I_TIP} rows={4} />
{:else if step === 2}
  <hgroup class="flex flex-col gap-hairline">
    <h3 class="type-h3 text-foreground">How I feel</h3>
    <p class="type-sm text-muted-foreground">Pick a word or two, or use your own.</p>
  </hgroup>
  <FeelingChips bind:value={composer.sections.feel} />
{:else}
  <h3 class="type-h3 text-foreground">What I need</h3>
  <div class="grid gap-stack sm:grid-cols-2">
    <HardTalkSection key="matters" bind:value={composer.sections.matters} />
    <HardTalkSection key="help" bind:value={composer.sections.help} />
    <div class="flex flex-col gap-related">
      <span class="type-label text-foreground">What kind of support feels right?</span>
      <ViewToggle
        label="What kind of support feels right?"
        class="w-full! [&>*]:flex-1"
        value={composer.supportWish ?? ""}
        options={SUPPORT_WISHES}
        onchange={(v) => (composer.supportWish = v || null)}
      />
    </div>
    <SelectField
      id="hard-talk-respond"
      label="How should {name || 'they'} respond?"
      value={composer.responseWish}
      options={RESPONSE_WISHES}
      onchange={(v) => (composer.responseWish = v)}
    />
  </div>
  <Alert.Root role="note">
    <Lock aria-hidden="true" />
    <Alert.Description
      >Only {name || "they"} receives this. There's no rush to reply; it's a note to come back to, not
      a live chat.</Alert.Description
    >
  </Alert.Root>
{/if}
