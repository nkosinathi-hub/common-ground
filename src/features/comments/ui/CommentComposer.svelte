<script lang="ts">
  import { AtSign, Send, X } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { memberName, type MemberRef, type Result } from "@/shared/domain"
  import { FormState } from "@/shared/ui"
  import { MAX_BODY } from "../domain/comment"
  import { ComposerState } from "./composer.svelte"
  import MentionPicker from "./MentionPicker.svelte"
  import type { Draft } from "./thread.svelte"

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

<form class="grid gap-2" onsubmit={submit} novalidate>
  <Label for={id}>Add a comment</Label>
  <Textarea
    {id}
    bind:ref={textarea}
    bind:value={composer.body}
    onkeydown={keydown}
    maxlength={MAX_BODY}
    placeholder="Plain text. Type @ to mention someone."
    aria-invalid={problem ? true : undefined}
  />
  {#if composer.mentionIds.length > 0}
    <ul class="flex flex-wrap gap-1" aria-label="Mentioning">
      {#each composer.mentionIds as mentioned (mentioned)}
        <li>
          <Badge variant="secondary">
            @{memberName(members, mentioned)}
            <button
              type="button"
              aria-label={`Do not mention ${memberName(members, mentioned)}`}
              onclick={() => composer.unmention(mentioned)}><X class="size-3" /></button
            >
          </Badge>
        </li>
      {/each}
    </ul>
  {/if}
  {#if composer.pickerOpen}
    <MentionPicker {composer} {members} {me} onDone={() => textarea?.focus()} />
  {/if}
  {#if problem}<p role="alert" class="text-sm text-destructive">{problem}</p>{/if}
  <div class="flex flex-wrap items-center gap-3">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-expanded={composer.pickerOpen}
      onclick={() => composer.openPicker()}><AtSign aria-hidden="true" />Mention</Button
    >
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" class="accent-primary" bind:checked={composer.spoiler} />
      Contains spoilers
    </label>
    <Button type="submit" size="sm" class="ml-auto" disabled={form.pending}>
      <Send aria-hidden="true" />Post
    </Button>
  </div>
</form>
