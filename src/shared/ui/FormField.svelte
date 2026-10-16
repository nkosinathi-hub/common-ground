<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import FormError from "./FormError.svelte"

  let {
    id,
    label,
    value = $bindable(""),
    type = "text",
    autocomplete,
    error,
    hint,
  }: {
    id: string
    label: string
    value?: string
    type?: string
    autocomplete?: HTMLInputElement["autocomplete"]
    error?: string | undefined
    hint?: string
  } = $props()
</script>

<div class="grid gap-1.5">
  <Label for={id}>{label}</Label>
  <Input
    {id}
    {type}
    {autocomplete}
    bind:value
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
    required
  />
  {#if error}
    <FormError id={`${id}-error`} message={error} alert={false} />
  {:else if hint}
    <p id={`${id}-hint`} class="text-xs text-muted-foreground">{hint}</p>
  {/if}
</div>
