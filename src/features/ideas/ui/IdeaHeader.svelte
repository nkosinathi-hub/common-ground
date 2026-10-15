<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { IDEA_STAGES, type Idea } from "../domain"
  import { useIdeas } from "./context"
  import { STAGE_LABELS } from "./labels"

  let { idea, onChange }: { idea: Idea; onChange: (idea: Idea) => void } = $props()
  const ideas = useIdeas()
  let error = $state<string | null>(null)

  async function apply(run: () => ReturnType<typeof ideas.rename>) {
    const result = await run()
    error = result.ok ? null : result.error.message
    if (result.ok) onChange(result.value)
  }
  const tagsOf = (text: string) => text.split(",")
</script>

<header class="flex flex-col gap-2">
  <label class="sr-only" for="idea-title">Title</label>
  <Input
    id="idea-title"
    class="h-10 text-xl font-semibold"
    value={idea.title}
    maxlength={200}
    onchange={(e) => apply(() => ideas.rename(idea.id, e.currentTarget.value))}
  />
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <label class="flex items-center gap-2"
      >Stage
      <select
        class="h-8 rounded-lg border border-input bg-background px-2"
        value={idea.stage}
        onchange={(e) =>
          apply(() => ideas.moveStage(idea.id, e.currentTarget.value as Idea["stage"]))}
      >
        {#each IDEA_STAGES as stage (stage)}<option value={stage}>{STAGE_LABELS[stage]}</option
          >{/each}
      </select>
    </label>
    <label class="flex grow items-center gap-2"
      >Tags
      <Input
        class="max-w-sm"
        value={idea.tags.join(", ")}
        placeholder="food, pop-up"
        onchange={(e) => apply(() => ideas.setTags(idea.id, tagsOf(e.currentTarget.value)))}
      />
    </label>
  </div>
  {#if error}<p class="text-sm text-destructive" role="alert">{error}</p>{/if}
</header>
