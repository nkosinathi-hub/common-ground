<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { EXPIRY_CHOICES, NOTE_MAX } from "../domain"
  import type { ComposerState } from "./composer-state.svelte"

  interface Props {
    composer: ComposerState
  }

  let { composer }: Props = $props()
</script>

<div class="grid gap-1.5">
  <Label for="note-body">Note</Label>
  <Textarea id="note-body" rows={4} maxlength={NOTE_MAX} bind:value={composer.body} />
  <p class="text-right text-xs text-muted-foreground">{composer.body.length} / {NOTE_MAX}</p>
</div>
<label class="flex min-h-11 items-center gap-2 text-sm">
  <input type="checkbox" class="accent-primary" bind:checked={composer.pinned} />Pin to the top
</label>
<div class="grid gap-1.5">
  <Label for="note-expiry">Expires</Label>
  <NativeSelect id="note-expiry" bind:value={composer.expiry}>
    {#each EXPIRY_CHOICES as choice (choice.value)}
      <option value={choice.value}>{choice.label}</option>
    {/each}
  </NativeSelect>
</div>
