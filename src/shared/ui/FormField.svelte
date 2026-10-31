<script lang="ts">
  import type { Component, Snippet } from "svelte"
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import { cn } from "$lib/utils"
  import FormError from "./FormError.svelte"

  /** The Figma field widths (field/*); full fills the column. */
  type Width = "full" | "date" | "time" | "select" | "number" | "hex" | "search"
  const WIDTHS: Record<Width, string> = {
    full: "w-full",
    date: "w-field-date",
    time: "w-field-time",
    select: "w-field-select",
    number: "w-field-number",
    hex: "w-field-hex",
    search: "w-field-search",
  }

  interface Props {
    id: string
    label: string
    value?: string
    type?: string
    autocomplete?: HTMLInputElement["autocomplete"]
    error?: string | undefined
    hint?: string
    icon?: Component
    width?: Width
    required?: boolean
    maxlength?: number
    placeholder?: string
    /** Marks the label "(optional)" in muted text, as the Figma composer fields do. */
    optional?: boolean
    /** Any other control (select, textarea); gets the id and the described-by ids. */
    control?: Snippet<[{ id: string; describedby: string | undefined; invalid: boolean }]>
  }

  let {
    id,
    label,
    value = $bindable(""),
    type = "text",
    autocomplete,
    error,
    hint,
    icon: Icon,
    width = "full",
    required = true,
    maxlength,
    placeholder,
    optional = false,
    control,
  }: Props = $props()
  const describedby = $derived(error ? `${id}-error` : hint ? `${id}-hint` : undefined)
</script>

<!-- Figma Input field (177:45): label, control, helper, 8 apart. -->
<div class={cn("flex max-w-full flex-col gap-related", WIDTHS[width])}>
  <Label for={id} class="type-label"
    >{optional ? `${label} ` : label}{#if optional}<span class="font-normal text-muted-foreground"
        >(optional)</span
      >{/if}</Label
  >
  {#if control}
    {@render control({ id, describedby, invalid: Boolean(error) })}
  {:else}
    <div class="relative">
      {#if Icon}
        <Icon
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      {/if}
      <Input
        {id}
        {type}
        {autocomplete}
        bind:value
        class={Icon ? "pl-9" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedby}
        required={required && !optional}
        {maxlength}
        {placeholder}
      />
    </div>
  {/if}
  {#if error}
    <FormError id={`${id}-error`} message={error} alert={false} />
  {:else if hint}
    <p id={`${id}-hint`} class="type-xs text-muted-foreground">{hint}</p>
  {/if}
</div>
