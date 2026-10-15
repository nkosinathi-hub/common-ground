<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { MEDIA_TYPES } from "../domain/labels"
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
    maxlength={200}
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
    onchange={(v) => (form.mediaType = v || "movie")}
  />
  <div class="grid gap-1.5">
    <Label for={id("year")}>Release year</Label>
    <Input id={id("year")} inputmode="numeric" maxlength={4} bind:value={form.year} />
  </div>
</div>
{@render problem("releaseYear")}
<div class="grid gap-1.5">
  <Label for={id("synopsis")}>Synopsis</Label>
  <Textarea id={id("synopsis")} rows={3} maxlength={2000} bind:value={form.synopsis} />
  {@render problem("synopsis")}
</div>
<div class="grid gap-1.5">
  <Label for={id("note")}>Where to watch (your note)</Label>
  <Input
    id={id("note")}
    maxlength={500}
    placeholder="For example: DVD on the shelf"
    bind:value={form.note}
  />
  <p class="text-xs text-muted-foreground">Member-entered note. No verified provider data.</p>
  {@render problem("availabilityNote")}
</div>
