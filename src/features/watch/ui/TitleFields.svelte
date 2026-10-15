<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { MEDIA_TYPES } from "../domain/labels"
  import { NOTE_MAX, SYNOPSIS_MAX, TITLE_MAX, YEAR_DIGITS } from "../domain/validation"
  import Choice from "./Choice.svelte"
  import type { TitleFormState } from "./title-form.svelte"

  interface Props {
    form: TitleFormState
    prefix: string
    errorFor: (field: string) => string | undefined
  }

  let { form, prefix, errorFor }: Props = $props()
  const id = (name: string) => `${prefix}-${name}`
</script>

{#snippet problem(field: string)}
  {#if errorFor(field)}
    <p id={id(`${field}-error`)} class="text-sm text-destructive">{errorFor(field)}</p>
  {/if}
{/snippet}

<div class="grid gap-1.5">
  <Label for={id("title")}>Title</Label>
  <Input
    id={id("title")}
    bind:value={form.title}
    maxlength={TITLE_MAX}
    required
    aria-invalid={errorFor("title") ? true : undefined}
  />
  {@render problem("title")}
</div>
<div class="grid grid-cols-2 gap-3">
  <Choice
    id={id("type")}
    label="Type"
    value={form.mediaType}
    options={MEDIA_TYPES}
    onchange={(value) => (form.mediaType = value || "movie")}
  />
  <div class="grid gap-1.5">
    <Label for={id("year")}>Release year</Label>
    <Input id={id("year")} inputmode="numeric" maxlength={YEAR_DIGITS} bind:value={form.year} />
  </div>
</div>
{@render problem("releaseYear")}
<div class="grid gap-1.5">
  <Label for={id("synopsis")}>Synopsis</Label>
  <Textarea id={id("synopsis")} rows={3} maxlength={SYNOPSIS_MAX} bind:value={form.synopsis} />
  {@render problem("synopsis")}
</div>
<div class="grid gap-1.5">
  <Label for={id("note")}>Where to watch (your note)</Label>
  <Input
    id={id("note")}
    maxlength={NOTE_MAX}
    placeholder="For example: DVD on the shelf"
    bind:value={form.note}
  />
  <p class="text-xs text-muted-foreground">Member-entered note. No verified provider data.</p>
  {@render problem("availabilityNote")}
</div>
