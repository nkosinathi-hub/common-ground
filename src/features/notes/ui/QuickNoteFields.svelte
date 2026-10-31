<script lang="ts">
  import { Lock } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { MemberRef } from "@/shared/domain"
  import { FormField, SelectField } from "@/shared/ui"
  import { EXPIRY_CHOICES, NOTE_MAX } from "../domain"
  import type { ComposerState } from "./composer-state.svelte"
  import RecipientField from "./RecipientField.svelte"

  interface Props {
    composer: ComposerState
    members: readonly MemberRef[]
    spaceName: string
  }

  let { composer, members, spaceName }: Props = $props()
  const expiries = EXPIRY_CHOICES.map((c) => ({ value: c.value, label: c.label }))
</script>

<!-- Figma S01 and S01b: who it is to, the note, when it goes, then what sending does. -->
<RecipientField bind:value={composer.to} {members} direct={false} />
<FormField
  id="note-body"
  label="Your note"
  hint="{composer.body.length.toLocaleString()} / {NOTE_MAX.toLocaleString()} characters"
>
  {#snippet control({ id, describedby })}
    <Textarea
      {id}
      rows={4}
      maxlength={NOTE_MAX}
      placeholder="Write a note…"
      aria-describedby={describedby}
      bind:value={composer.body}
    />
  {/snippet}
</FormField>
<div class="flex flex-wrap items-end gap-stack">
  <div class="w-field-select">
    <SelectField
      id="note-expiry"
      label="Expires"
      value={composer.expiry}
      options={expiries}
      onchange={(v) => (composer.expiry = v)}
    />
  </div>
  <div class="flex min-h-10 items-center gap-related">
    <Checkbox id="note-pin" bind:checked={composer.pinned} />
    <Label for="note-pin" class="type-sm">Pin to the top</Label>
  </div>
</div>
<Alert.Root role="note">
  <Lock aria-hidden="true" />
  <Alert.Description
    >Your note is shared in {spaceName} when you send it, and they get a notification.</Alert.Description
  >
</Alert.Root>
