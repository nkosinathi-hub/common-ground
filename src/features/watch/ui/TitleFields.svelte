<script lang="ts">
  import { TITLE_MAX } from "@/shared/domain"
  import { Input } from "$lib/components/ui/input"
  import { Textarea } from "$lib/components/ui/textarea"
  import { CollapsibleGroup, FormField, SelectField } from "@/shared/ui"
  import { MEDIA_TYPES } from "../domain/labels"
  import { NOTE_MAX, SYNOPSIS_MAX, YEAR_DIGITS } from "../domain/validation"
  import type { TitleFormState } from "./title-form-state.svelte"

  interface Props {
    form: TitleFormState
    prefix: string
    errorFor: (field: string) => string | undefined
    /** Synopsis and where to watch wait under "More details" (S04); open when editing. */
    folded?: boolean
  }

  let { form, prefix, errorFor, folded = false }: Props = $props()
  const id = (name: string) => `${prefix}-${name}`
</script>

{#snippet details()}
  <FormField id={id("synopsis")} label="Synopsis" optional error={errorFor("synopsis")}>
    {#snippet control({ id: control, describedby })}
      <Textarea
        id={control}
        rows={3}
        maxlength={SYNOPSIS_MAX}
        aria-describedby={describedby}
        bind:value={form.synopsis}
      />
    {/snippet}
  </FormField>
  <FormField
    id={id("note")}
    label="Where to watch"
    optional
    maxlength={NOTE_MAX}
    placeholder="For example: DVD on the shelf"
    hint="Your own note. No verified provider data."
    bind:value={form.note}
    error={errorFor("availabilityNote")}
  />
{/snippet}

<!-- Figma S04: the title, its type and year, then the rest folded away. -->
<FormField
  id={id("title")}
  label="Title"
  maxlength={TITLE_MAX}
  placeholder="Enter the title"
  bind:value={form.title}
  error={errorFor("title")}
/>
<div class="grid grid-cols-2 gap-stack">
  <SelectField
    id={id("type")}
    label="Type"
    value={form.mediaType}
    options={MEDIA_TYPES}
    onchange={(value) => (form.mediaType = value)}
  />
  <FormField
    id={id("year")}
    label="Release year"
    optional
    placeholder="e.g. 2016"
    error={errorFor("releaseYear")}
  >
    {#snippet control({ id: control, describedby })}
      <Input
        id={control}
        inputmode="numeric"
        maxlength={YEAR_DIGITS}
        placeholder="e.g. 2016"
        aria-describedby={describedby}
        bind:value={form.year}
      />
    {/snippet}
  </FormField>
</div>
{#if folded}
  <CollapsibleGroup title="More details" meta="Synopsis, where to watch">
    <div class="flex flex-col gap-stack pt-stack">{@render details()}</div>
  </CollapsibleGroup>
{:else}
  {@render details()}
{/if}
