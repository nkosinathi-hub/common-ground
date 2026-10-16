<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { FormField, FormState } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import type { SpaceTemplateId } from "../../domain/templates"
  import { useSpaces } from "../context"
  import TemplatePicker from "../TemplatePicker.svelte"
  import IconPicker from "./IconPicker.svelte"
  import { saveAndRefresh } from "./save"

  let { space }: { space: Space } = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  // Seeded once; the fields are the owner's draft from then on.
  let name = $state(untrack(() => space.name))
  let template = $state<SpaceTemplateId>(untrack(() => space.template))
  let tagline = $state(untrack(() => space.tagline))
  let description = $state(untrack(() => space.description))
  let icon = $state<string | null>(untrack(() => space.icon))

  async function save(event: SubmitEvent) {
    event.preventDefault()
    const fields = { name, template, tagline, description, icon }
    await saveAndRefresh(form, store, () => service.profile.saveGeneral(space.id, fields))
  }
</script>

<Card.Root id="settings-general" tabindex={-1}>
  <Card.Header><Card.Title>Name and feel</Card.Title></Card.Header>
  <Card.Content>
    <form class="grid gap-4" onsubmit={save} novalidate>
      <FormField id="space-name" label="Name" bind:value={name} error={form.fieldError("name")} />
      <div class="grid gap-1.5">
        <Label for="space-tagline">Tagline</Label>
        <Input
          id="space-tagline"
          bind:value={tagline}
          maxlength={120}
          aria-invalid={form.fieldError("tagline") ? true : undefined}
          aria-describedby="space-tagline-hint"
        />
        <p id="space-tagline-hint" class="text-xs text-muted-foreground">
          {form.fieldError("tagline") ?? "One short line under the greeting on Home."}
        </p>
      </div>
      <div class="grid gap-1.5">
        <Label for="space-description">Description</Label>
        <Textarea
          id="space-description"
          bind:value={description}
          rows={3}
          aria-invalid={form.fieldError("description") ? true : undefined}
          aria-describedby={form.fieldError("description") ? "space-description-error" : undefined}
        />
        {#if form.fieldError("description")}
          <p id="space-description-error" class="text-sm text-destructive">
            {form.fieldError("description")}
          </p>
        {/if}
      </div>
      <IconPicker bind:value={icon} />
      <TemplatePicker bind:value={template} />
      {#if form.formError}<p role="alert" class="text-sm text-destructive">{form.formError}</p>{/if}
      <Button type="submit" class="w-fit" disabled={form.pending}>Save</Button>
    </form>
  </Card.Content>
</Card.Root>
