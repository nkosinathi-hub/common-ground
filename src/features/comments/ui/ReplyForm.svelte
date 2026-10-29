<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { Result } from "@/shared/domain"
  import { FormError, FormState } from "@/shared/ui"
  import { BODY_MAX } from "../domain/comment"

  interface Props {
    author: string
    onSend: (body: string) => Promise<Result<unknown>>
    onDone: () => void
  }

  let { author, onSend, onDone }: Props = $props()
  const form = new FormState()
  const uid = $props.id()
  const id = `reply-${uid}`
  let body = $state("")

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const sent = await form.run(() => onSend(body))
    if (sent.ok) onDone()
  }
</script>

<form class="flex flex-col gap-related" onsubmit={submit} novalidate>
  <Label for={id} class="sr-only">Reply to {author}</Label>
  <Textarea
    {id}
    bind:value={body}
    maxlength={BODY_MAX}
    class="min-h-16"
    placeholder="Reply to {author}"
    autofocus
  />
  <FormError message={form.fieldError("body") ?? form.formError} />
  <div class="flex justify-end gap-related">
    <Button type="button" variant="ghost" size="sm" onclick={onDone}>Cancel</Button>
    <Button type="submit" size="sm" disabled={form.pending}>Reply</Button>
  </div>
</form>
