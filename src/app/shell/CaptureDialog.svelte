<script lang="ts">
  import { untrack } from "svelte"
  import {
    announceCaptured,
    captureRequest,
    IDEA_TEMPLATE_OPTIONS,
    type IdeaTemplate,
    useIdeas,
  } from "@/features/ideas"
  import {
    DialogShell,
    FormError,
    FormField,
    FormState,
    navigate,
    SelectField,
    toast,
  } from "@/shared/ui"
  import { captureDraft } from "./draft"

  interface Props {
    spaceId: string
  }

  let { spaceId }: Props = $props()
  const ideas = useIdeas().service
  const form = new FormState()
  let title = $state(untrack(() => captureDraft.read(spaceId)))
  let template = $state<IdeaTemplate>("blank")
  const templates = IDEA_TEMPLATE_OPTIONS.map((option) => ({
    value: option.id,
    label: option.label,
  }))
  $effect(() => captureDraft.write(spaceId, title))

  async function submit() {
    const made = await form.run(() => ideas.capture({ spaceId, title, template }))
    if (!made.ok) return
    announceCaptured(made.value)
    title = ""
    template = "blank"
    captureRequest.open = false
    toast.success("Idea saved", {
      action: {
        label: "Open",
        onClick: () => navigate({ name: "idea", spaceId, ideaId: made.value.id, tab: "overview" }),
      },
    })
  }
</script>

<DialogShell
  bind:open={captureRequest.open}
  title="Catch it before it goes"
  description="Just a title is enough. A template adds the questions worth answering later."
  primary="Save idea"
  busy={form.pending}
  disabled={!title.trim()}
  onsubmit={submit}
>
  <FormField id="quick-idea" label="Idea" bind:value={title} error={form.fieldError("title")} />
  <SelectField
    id="quick-idea-template"
    label="Template"
    value={template}
    options={templates}
    onchange={(value) => (template = value)}
  />
  <FormError message={form.formError} />
</DialogShell>
