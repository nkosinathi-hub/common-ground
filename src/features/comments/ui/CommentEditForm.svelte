<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { Result } from "@/shared/domain"
  import { toast } from "@/shared/ui"
  import { MAX_BODY } from "../domain/comment"

  let {
    body,
    spoiler,
    onSave,
    onDone,
  }: {
    body: string
    spoiler: boolean
    onSave: (body: string, spoiler: boolean) => Promise<Result<unknown>>
    onDone: () => void
  } = $props()

  // Seeded once from the comment; later prop changes must not overwrite what is being typed.
  let draft = $state(untrack(() => body))
  let draftSpoiler = $state(untrack(() => spoiler))

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const saved = await onSave(draft, draftSpoiler)
    if (!saved.ok) return toast.error(saved.error.message)
    onDone()
  }
</script>

<form class="grid gap-2" onsubmit={save}>
  <Textarea aria-label="Edit comment" bind:value={draft} maxlength={MAX_BODY} />
  <label class="flex items-center gap-2 text-sm">
    <input type="checkbox" class="accent-primary" bind:checked={draftSpoiler} />
    Contains spoilers
  </label>
  <div class="flex gap-2">
    <Button type="submit" size="sm">Save</Button>
    <Button size="sm" variant="ghost" onclick={onDone}>Cancel</Button>
  </div>
</form>
