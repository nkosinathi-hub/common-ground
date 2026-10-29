<script lang="ts">
  import type { Result } from "@/shared/domain"
  import { DialogShell, FormError, FormField } from "@/shared/ui"
  import type { Idea } from "../domain"
  import { useIdeas } from "./context"

  interface Props {
    open: boolean
    idea: Idea
    onChange: (idea: Idea) => void
  }

  let { open = $bindable(false), idea, onChange }: Props = $props()
  const ideas = useIdeas().service
  let title = $state("")
  let tags = $state("")
  let busy = $state(false)
  let error = $state<string | null>(null)

  $effect(() => {
    if (!open) return
    title = idea.title
    tags = idea.tags.join(", ")
    error = null
  })

  async function save() {
    busy = true
    const renamed: Result<Idea> = await ideas.rename(idea.id, title)
    const tagged = renamed.ok ? await ideas.setTags(idea.id, tags.split(",")) : renamed
    busy = false
    if (!tagged.ok) return (error = tagged.error.message)
    onChange(tagged.value)
    open = false
  }
</script>

<!-- The idea's name and tags, edited together; the header shows them as a title and chips. -->
<DialogShell bind:open title="Edit this idea" primary="Save" {busy} onsubmit={save}>
  <div class="flex flex-col gap-stack">
    <FormField id="idea-details-title" label="Title" bind:value={title} required />
    <FormField
      id="idea-details-tags"
      label="Tags"
      bind:value={tags}
      hint="Separate tags with commas, e.g. food, pop-up."
    />
    <FormError message={error} />
  </div>
</DialogShell>
