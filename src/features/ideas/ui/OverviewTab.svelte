<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import { toast } from "@/shared/ui"
  import {
    BRIEF_FIELDS,
    BRIEF_MAX,
    IDEA_TEMPLATE_OPTIONS,
    changedFields,
    type Brief,
    type Idea,
  } from "../domain"
  import BriefMerge from "./BriefMerge.svelte"
  import { useIdeas } from "./context"
  import { BRIEF_LABELS } from "./labels"

  let { idea, onSaved }: { idea: Idea; onSaved: (idea: Idea) => void } = $props()
  const ideas = useIdeas()

  // The editor owns its copy from mount; IdeaDetail remounts it per idea.
  let base = $state(untrack(() => idea))
  let draft = $state<Brief>(untrack(() => ({ ...idea.brief })))
  let latest = $state<Idea | null>(null)
  let busy = $state(false)
  let fieldError = $state<{ field?: string; message: string } | null>(null)

  const ordered = $derived.by(() => {
    const focus = IDEA_TEMPLATE_OPTIONS.find((t) => t.id === idea.template)?.focus ?? []
    return [...focus, ...BRIEF_FIELDS.filter((f) => !focus.includes(f))]
  })

  async function save(brief: Brief, from: Idea) {
    busy = true
    const result = await ideas.saveBrief(from, brief)
    busy = false
    if (!result.ok) return void (fieldError = result.error)
    fieldError = null
    if (result.value.status === "conflict") {
      const theirs = result.value.latest
      // Only title, stage or tags moved underneath us: nothing in the overview to merge.
      if (changedFields(from.brief, theirs.brief).length === 0) return save(brief, theirs)
      latest = theirs
      return
    }
    base = result.value.idea
    draft = { ...base.brief }
    latest = null
    onSaved(base)
    toast.success("Overview saved")
  }
</script>

{#if latest}
  <BriefMerge
    mine={draft}
    {latest}
    onCancel={() => (latest = null)}
    onResolve={(merged) => latest && save(merged, latest)}
  />
{:else}
  <form class="flex flex-col gap-4" onsubmit={(e) => (e.preventDefault(), save(draft, base))}>
    {#each ordered as field (field)}
      <div class="flex flex-col gap-1">
        <label for="brief-{field}" class="text-sm font-medium">{BRIEF_LABELS[field]}</label>
        <Textarea
          id="brief-{field}"
          maxlength={BRIEF_MAX}
          rows={field === "pitch" ? 2 : 3}
          value={draft[field] ?? ""}
          oninput={(e) => (draft = { ...draft, [field]: e.currentTarget.value })}
          aria-invalid={fieldError?.field === field ? true : undefined}
        />
        {#if fieldError?.field === field}<p class="text-sm text-destructive">
            {fieldError.message}
          </p>{/if}
      </div>
    {/each}
    {#if fieldError && !fieldError.field}<p class="text-sm text-destructive" role="alert">
        {fieldError.message}
      </p>{/if}
    <Button type="submit" class="self-start" disabled={busy}>Save overview</Button>
  </form>
{/if}
