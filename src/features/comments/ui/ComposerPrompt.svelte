<script lang="ts">
  import { Heart, Lightbulb, Quote, SendHorizontal } from "@lucide/svelte"
  import { Badge } from "$lib/components/ui/badge"
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { MemberRef, Result } from "@/shared/domain"
  import { Chip, FormError, FormState, InitialAvatar } from "@/shared/ui"
  import { BODY_MAX } from "../domain/comment"
  import { ComposerState } from "./composer-state.svelte"
  import MentionChips from "./MentionChips.svelte"
  import MentionPicker from "./MentionPicker.svelte"
  import type { Draft } from "./thread-state.svelte"

  interface Props {
    members: readonly MemberRef[]
    me: string
    /** Your first name, for the prompt. */
    name: string
    /** The episode the comment will be about, e.g. "E3"; null on All before you start. */
    episode: string | null
    onSubmit: (draft: Draft) => Promise<Result<unknown>>
  }
  let { members, me, name, episode, onSubmit }: Props = $props()

  const composer = new ComposerState()
  const form = new FormState()
  const uid = $props.id()
  const id = `prompt-${uid}`
  let textarea = $state<HTMLTextAreaElement | null>(null)
  const STARTERS = [
    { label: "Favourite moment", icon: Heart },
    { label: "Theory", icon: Lightbulb },
    { label: "Quote", icon: Quote },
  ] as const

  function start(label: string) {
    if (!composer.body.startsWith(`${label}: `)) composer.body = `${label}: ${composer.body}`
    textarea?.focus()
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const sent = await form.run(() => onSubmit(composer.draft))
    if (sent.ok) composer.reset()
  }
</script>

<!-- Composer prompt (289:9546, phones 296:10521): open at the top, with three ways to start. -->
<form
  class="flex flex-col gap-item rounded-lg border border-border bg-muted/50 p-item"
  onsubmit={submit}
  novalidate
>
  <!-- Phones: badge and send share the prompt line, starters scroll below; wider, they sit last. -->
  <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-related">
    <div class="flex items-start gap-related md:col-span-2">
      <InitialAvatar {name} size="sm" tone="brand" decorative />
      <Label for={id} class="sr-only">Add a comment</Label>
      <Textarea
        {id}
        bind:ref={textarea}
        bind:value={composer.body}
        onkeydown={(event) => composer.handleKey(event.key) && event.preventDefault()}
        maxlength={BODY_MAX}
        rows={1}
        placeholder={`What did you think${episode ? ` of ${episode}` : ""}, ${name}?`}
        class="min-h-8 flex-1 resize-none border-0 bg-transparent px-0 py-hairline shadow-none focus-visible:ring-0"
      />
    </div>
    <div class="flex items-center gap-related md:col-start-2 md:row-start-2">
      {#if episode}<Badge variant="secondary" title="This comment is about {episode}"
          >{episode}</Badge
        >{/if}
      <Button type="submit" size="icon-sm" aria-label="Post" disabled={form.pending}
        ><SendHorizontal /></Button
      >
    </div>
    <div
      class="col-span-2 flex min-w-0 gap-related overflow-x-auto md:col-span-1 md:col-start-1 md:row-start-2"
    >
      {#each STARTERS as starter (starter.label)}
        <Chip icon={starter.icon} onclick={() => start(starter.label)}>{starter.label}</Chip>
      {/each}
    </div>
  </div>
  <MentionChips {composer} {members} />
  {#if composer.pickerOpen}
    <MentionPicker {composer} {members} {me} onDone={() => textarea?.focus()} />
  {/if}
  <FormError message={form.fieldError("body") ?? form.formError} />
</form>
