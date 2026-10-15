<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Plus } from "@lucide/svelte"
  import type { AppError } from "@/shared/domain"
  import { IDEA_TEMPLATE_OPTIONS, type IdeaTemplate } from "../domain"

  let {
    onCapture,
  }: { onCapture: (title: string, template: IdeaTemplate) => Promise<AppError | null> } = $props()

  let title = $state("")
  let template = $state<IdeaTemplate>("blank")
  let error = $state<string | null>(null)
  let busy = $state(false)

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    busy = true
    const failure = await onCapture(title, template)
    busy = false
    error = failure?.message ?? null
    if (!failure) title = ""
  }
</script>

<form class="flex flex-col gap-2 sm:flex-row" onsubmit={submit} aria-label="Capture an idea">
  <label class="sr-only" for="idea-capture">Idea title</label>
  <Input
    id="idea-capture"
    bind:value={title}
    placeholder="Capture an idea..."
    maxlength={200}
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? "idea-capture-error" : undefined}
  />
  <label class="sr-only" for="idea-template">Template</label>
  <select
    id="idea-template"
    bind:value={template}
    class="h-8 rounded-lg border border-input bg-background px-2 text-sm"
  >
    {#each IDEA_TEMPLATE_OPTIONS as option (option.id)}
      <option value={option.id}>{option.label}</option>
    {/each}
  </select>
  <Button type="submit" disabled={busy || !title.trim()}><Plus />Capture</Button>
</form>
{#if error}<p id="idea-capture-error" class="text-sm text-destructive" role="alert">{error}</p>{/if}
