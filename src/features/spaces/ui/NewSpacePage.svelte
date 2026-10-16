<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { ErrorState, FormError, FormField, FormState, navigate } from "@/shared/ui"
  import { templateFor, type SpaceTemplateId } from "../domain/templates"
  import { useSpaces } from "./context"
  import TemplatePicker from "./TemplatePicker.svelte"

  const { service, store } = useSpaces()
  const form = new FormState()
  let template = $state<SpaceTemplateId>("couple")
  let name = $state(templateFor("couple").suggestedName)
  let touched = $state(false)

  function pick(id: SpaceTemplateId) {
    if (!touched) name = templateFor(id).suggestedName
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault()
    const created = await form.run(() => service.create(name, template))
    if (!created.ok) return
    await store.refresh()
    navigate({ name: "home", spaceId: created.value })
  }
</script>

<main class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-10">
  <div>
    <p class="font-serif text-primary">Common Ground</p>
    <h1 class="text-3xl font-semibold">Make a space for your people</h1>
    <p class="mt-1 text-muted-foreground">
      Pick a feel, name it, then invite whoever you share your nights and ideas with. Have an invite
      link instead? Open it and you will join their space.
    </p>
  </div>
  {#if store.status === "error" && store.error}
    <!-- Loading memberships failed, so the app could not tell whether you have spaces yet. -->
    <ErrorState error={store.error} onRetry={() => store.refresh()} />
  {/if}
  <form class="grid gap-5" onsubmit={submit} novalidate>
    <TemplatePicker bind:value={template} onPick={pick} />
    <div oninput={() => (touched = true)}>
      <FormField
        id="space-name"
        label="Space name"
        bind:value={name}
        error={form.fieldError("name")}
      />
    </div>
    <FormError message={form.formError} />
    <div class="flex gap-2">
      <Button type="submit" disabled={form.pending}>Create space</Button>
      {#if store.spaces.length > 0}<Button variant="ghost" href="#/">Cancel</Button>{/if}
    </div>
  </form>
</main>
