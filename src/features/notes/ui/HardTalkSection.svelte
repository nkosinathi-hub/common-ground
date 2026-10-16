<script lang="ts">
  import type { Snippet } from "svelte"
  import { Label } from "$lib/components/ui/label"
  import { Textarea } from "$lib/components/ui/textarea"
  import { SECTION_COPY, SECTION_MAX, showCounter, type SectionKey } from "../domain"

  interface Props {
    key: SectionKey
    value?: string
    ref?: HTMLTextAreaElement | null
    children?: Snippet
  }

  let { key, value = $bindable(""), ref = $bindable(null), children }: Props = $props()
  const id = $derived(`hard-talk-${key}`)
  const copy = $derived(SECTION_COPY[key])
  const long = $derived(value.length > SECTION_MAX)
</script>

<div class="grid gap-1.5">
  <Label for={id}>{copy.label}</Label>
  <Textarea
    {id}
    rows={2}
    placeholder={copy.placeholder}
    aria-invalid={long || undefined}
    aria-describedby={showCounter(value) ? `${id}-count` : undefined}
    bind:ref
    bind:value
  />
  {#if showCounter(value)}
    <p
      id="{id}-count"
      class="text-right text-xs {long ? 'text-destructive' : 'text-muted-foreground'}"
    >
      {value.length} / {SECTION_MAX}
    </p>
  {/if}
  {@render children?.()}
</div>
