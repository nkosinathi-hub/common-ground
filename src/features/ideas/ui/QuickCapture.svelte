<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { FormError } from "@/shared/ui"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Plus } from "@lucide/svelte"
  import { type AppError, TITLE_MAX } from "@/shared/domain"
  import { IDEA_TEMPLATE_OPTIONS, type IdeaTemplate } from "../domain"

  interface Props {
    onCapture: (title: string, template: IdeaTemplate) => Promise<AppError | null>
  }

  let { onCapture }: Props = $props()

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

<!-- Figma "Catch it before it goes" (D04): the title, a template, one icon button to save it. -->
<Card.Root>
  <Card.Header><Card.Title>Catch it before it goes</Card.Title></Card.Header>
  <Card.Content class="flex flex-col gap-item">
    <form
      class="flex flex-col gap-item sm:flex-row sm:items-end"
      onsubmit={submit}
      aria-label="Capture an idea"
    >
      <div class="flex min-w-0 flex-1 flex-col gap-related">
        <Label for="idea-capture" class="type-label">Idea</Label>
        <Input
          id="idea-capture"
          bind:value={title}
          placeholder="Capture an idea…"
          maxlength={TITLE_MAX}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "idea-capture-error" : "idea-capture-hint"}
        />
      </div>
      <div class="flex flex-col gap-related sm:w-55">
        <Label for="idea-template" class="type-label">Template</Label>
        <NativeSelect id="idea-template" class="w-full" bind:value={template}>
          {#each IDEA_TEMPLATE_OPTIONS as option (option.id)}
            <option value={option.id}>{option.label}</option>
          {/each}
        </NativeSelect>
      </div>
      <Button type="submit" size="icon" aria-label="Capture" disabled={busy || !title.trim()}
        ><Plus /></Button
      >
    </form>
    <FormError id="idea-capture-error" message={error} />
    <p id="idea-capture-hint" class="type-xs text-muted-foreground">
      Templates: {IDEA_TEMPLATE_OPTIONS.map((option) => option.label).join(", ")}. Shared with the
      space once saved.
    </p>
  </Card.Content>
</Card.Root>
