<script lang="ts">
  import { untrack } from "svelte"
  import { Lightbulb } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"
  import { useIdeas } from "@/features/ideas"
  import { buildHash } from "@/shared/domain"
  import { FormField, FormState, toast } from "@/shared/ui"
  import { captureDraft } from "./draft"

  interface Props {
    spaceId: string
  }

  let { spaceId }: Props = $props()
  const ideas = useIdeas().service
  const form = new FormState()
  let open = $state(false)
  let title = $state(untrack(() => captureDraft.read(spaceId)))
  $effect(() => captureDraft.write(spaceId, title))

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const made = await form.run(() => ideas.capture({ spaceId, title }))
    if (!made.ok) return
    title = ""
    open = false
    toast.success("Idea saved", {
      action: {
        label: "Open",
        onClick: () =>
          (location.hash = buildHash({
            name: "idea",
            spaceId,
            ideaId: made.value.id,
            tab: "overview",
          })),
      },
    })
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline" size="sm" aria-label="Capture an idea from anywhere">
        <Lightbulb class="size-4" aria-hidden="true" /><span class="hidden sm:inline"
          >Capture idea</span
        >
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Catch it before it goes</Dialog.Title>
      <Dialog.Description>Just a title is enough. It lands in your Ideas inbox.</Dialog.Description>
    </Dialog.Header>
    <form class="grid gap-4" onsubmit={submit} novalidate>
      <FormField id="quick-idea" label="Idea" bind:value={title} error={form.fieldError("title")} />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" disabled={form.pending || !title.trim()}>Save idea</Button>
    </form>
  </Dialog.Content>
</Dialog.Root>
