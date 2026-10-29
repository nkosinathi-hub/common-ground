<script lang="ts">
  import { untrack } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { Textarea } from "$lib/components/ui/textarea"
  import { FormError, FormField, FormState, SelectField, SettingsSection } from "@/shared/ui"
  import { SPACE_ICONS } from "../../domain/profile"
  import type { Space } from "../../domain/space"
  import { SPACE_TEMPLATES, type SpaceTemplateId } from "../../domain/templates"
  import { useSpaces } from "../context"
  import { saveAndRefresh } from "./save"

  let { space }: { space: Space } = $props()
  const { service, store } = useSpaces()
  const form = new FormState()
  // Seeded once; the fields are the owner's draft from then on.
  let name = $state(untrack(() => space.name))
  let template = $state<SpaceTemplateId>(untrack(() => space.template))
  let tagline = $state(untrack(() => space.tagline))
  let description = $state(untrack(() => space.description))
  let icon = $state<string>(untrack(() => space.icon ?? ""))
  const types = SPACE_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))
  const word = (key: string) => key.replace(/-\d+$/, "").replace("-", " ")
  const icons = [
    { value: "", label: "Initial letter" },
    ...SPACE_ICONS.map((key) => ({
      value: key,
      label: word(key)[0]!.toUpperCase() + word(key).slice(1),
    })),
  ]

  async function save() {
    const fields = { name, template, tagline, description, icon: icon || null }
    await saveAndRefresh(form, store, () => service.profile.saveGeneral(space.id, fields))
  }
</script>

<!-- Figma D15a Identity: name and tagline, the description, then type and icon side by side. -->
<SettingsSection
  id="settings-general"
  title="Identity"
  description="The name and details every member sees."
>
  <form class="flex flex-col gap-stack" novalidate onsubmit={(e) => (e.preventDefault(), save())}>
    <div class="grid gap-stack sm:grid-cols-2">
      <FormField
        id="space-name"
        label="Space name"
        bind:value={name}
        error={form.fieldError("name")}
      />
      <FormField
        id="space-tagline"
        label="Tagline"
        maxlength={120}
        bind:value={tagline}
        error={form.fieldError("tagline")}
      />
    </div>
    <FormField id="space-description" label="Description" error={form.fieldError("description")}>
      {#snippet control({ id, describedby, invalid })}
        <Textarea
          {id}
          rows={3}
          aria-describedby={describedby}
          aria-invalid={invalid || undefined}
          bind:value={description}
        />
      {/snippet}
    </FormField>
    <div class="grid gap-stack sm:grid-cols-2">
      <SelectField
        id="space-type"
        label="Space type"
        value={template}
        options={types}
        onchange={(v) => (template = v)}
      />
      <SelectField
        id="space-icon"
        label="Space icon"
        value={icon}
        options={icons}
        onchange={(v) => (icon = v)}
      />
    </div>
    <FormError message={form.formError} />
    <div class="flex justify-end border-t border-border pt-stack">
      <Button type="submit" disabled={form.pending}>Save changes</Button>
    </div>
  </form>
</SettingsSection>
