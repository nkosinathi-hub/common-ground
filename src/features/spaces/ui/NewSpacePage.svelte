<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import {
    AuthCard,
    ErrorState,
    FormError,
    FormField,
    FormState,
    navigate,
    PublicLayout,
  } from "@/shared/ui"
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

<!-- Figma D19: the kind of space, its name, then create it; back to your spaces if you have any. -->
<PublicLayout hero="Good things have a place here.">
  <AuthCard
    title="Make a space for your people"
    description="Pick a kind of space and name it. Invite people once it is ready."
    backHref={store.spaces.length > 0 ? "#/" : undefined}
    backLabel="Your spaces"
  >
    {#if store.status === "error" && store.error}
      <!-- Loading memberships failed, so the app could not tell whether you have spaces yet. -->
      <ErrorState error={store.error} onRetry={() => store.refresh()} />
    {/if}
    <form class="flex flex-col gap-stack" onsubmit={submit} novalidate>
      <TemplatePicker bind:value={template} onPick={pick} />
      <div oninput={() => (touched = true)}>
        <FormField
          id="space-name"
          label="Space name"
          bind:value={name}
          error={form.fieldError("name")}
          hint="You can change this later in Space settings."
        />
      </div>
      <FormError message={form.formError} />
      <div class="flex justify-end gap-item">
        {#if store.spaces.length > 0}<Button variant="link" href="#/">Cancel</Button>{/if}
        <Button type="submit" disabled={form.pending}>Create space</Button>
      </div>
    </form>
  </AuthCard>
</PublicLayout>
