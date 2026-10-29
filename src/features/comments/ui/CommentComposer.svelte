<script lang="ts">
  import { AtSign } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { MemberRef, Result } from "@/shared/domain"
  import { FormError, FormState } from "@/shared/ui"
  import { BODY_MAX } from "../domain/comment"
  import { ComposerState } from "./composer-state.svelte"
  import MentionChips from "./MentionChips.svelte"
  import MentionPicker from "./MentionPicker.svelte"
  import type { Draft } from "./thread-state.svelte"

  interface Props {
    members: readonly MemberRef[]
    me: string
    onSubmit: (draft: Draft) => Promise<Result<unknown>>
  }
  let { members, me, onSubmit }: Props = $props()

  const composer = new ComposerState()
  const form = new FormState()
  const id = `comment-${Math.random().toString(36).slice(2)}`
  let textarea = $state<HTMLTextAreaElement | null>(null)
  const problem = $derived(form.fieldError("body") ?? form.formError)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const sent = await form.run(() => onSubmit(composer.draft))
    if (sent.ok) composer.reset()
  }

  const keydown = (event: KeyboardEvent) => {
    if (composer.handleKey(event.key)) event.preventDefault()
  }
</script>

<!-- D03b composer: the box, then spoilers on the left and mention and Post on the right. -->
<form class="grid gap-item" onsubmit={submit} novalidate>
  <Label for={id} class="sr-only">Add a comment</Label>
  <Textarea
    {id}
    bind:ref={textarea}
    bind:value={composer.body}
    onkeydown={keydown}
    maxlength={BODY_MAX}
    placeholder="Write a comment. Type @ to mention someone."
    class="min-h-24"
    aria-invalid={problem ? true : undefined}
  />
  <MentionChips {composer} {members} />
  {#if composer.pickerOpen}
    <MentionPicker {composer} {members} {me} onDone={() => textarea?.focus()} />
  {/if}
  <FormError message={problem} />
  <div class="flex flex-wrap items-center gap-related">
    <Label class="flex items-center gap-related">
      <Checkbox bind:checked={composer.spoiler} />Contains spoilers
    </Label>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      class="ml-auto"
      aria-label="Mention"
      aria-expanded={composer.pickerOpen}
      onclick={() => composer.openPicker()}><AtSign /></Button
    >
    <Button type="submit" size="sm" disabled={form.pending}>Post</Button>
  </div>
</form>
