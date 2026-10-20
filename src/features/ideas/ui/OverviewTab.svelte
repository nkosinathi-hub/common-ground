<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import type { AppError } from "@/shared/domain"
  import { FormError, toast } from "@/shared/ui"
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

  interface Props {
    idea: Idea
    onSaved: (idea: Idea) => void
  }

  let { idea, onSaved }: Props = $props()
  const ideas = useIdeas().service

  // The editor owns its copy from mount; IdeaDetail remounts it per idea.
  let base = $state(untrack(() => idea))
  let draft = $state<Brief>(untrack(() => ({ ...idea.brief })))
  let latest = $state<Idea | null>(null)
  let busy = $state(false)
  let fieldError = $state<AppError | null>(null)

  const ordered = $derived.by(() => {
    const focus = IDEA_TEMPLATE_OPTIONS.find((option) => option.id === idea.template)?.focus ?? []
    return [...focus, ...BRIEF_FIELDS.filter((field) => !focus.includes(field))]
  })

  async function save(brief: Brief, from: Idea) {
    busy = true
    const result = await ideas.saveBrief(from, brief)
    busy = false
    if (!result.ok) {
      fieldError = result.error
      return
    }
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

  function submit(event: SubmitEvent) {
    event.preventDefault()
    void save(draft, base)
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
  <form class="flex flex-col gap-4" onsubmit={submit}>
    {#each ordered as field (field)}
      <div class="flex flex-col gap-1">
        <label for="brief-{field}" class="text-sm font-medium">{BRIEF_LABELS[field]}</label>
        <Textarea
          id="brief-{field}"
          maxlength={BRIEF_MAX}
          rows={field === "pitch" ? 2 : 3}
          value={draft[field] ?? ""}
          oninput={(event) => (draft = { ...draft, [field]: event.currentTarget.value })}
          aria-invalid={fieldError?.field === field ? true : undefined}
        />
        {#if fieldError?.field === field}<p class="text-sm text-destructive">
            {fieldError.message}
          </p>{/if}
      </div>
    {/each}
    <FormError message={fieldError && !fieldError.field ? fieldError.message : null} />
    <Button type="submit" class="self-start" disabled={busy}>Save overview</Button>
  </form>
{/if}
