<script lang="ts">
  import { Textarea } from "$lib/components/ui/textarea"
  import { FormField } from "@/shared/ui"
  import { SECTION_COPY, SECTION_MAX, showCounter, type SectionKey } from "../domain"

  interface Props {
    key: SectionKey
    value?: string
    /** Under the box, e.g. the tip to start with "I". */
    hint?: string
    rows?: number
  }

  let { key, value = $bindable(""), hint, rows = 3 }: Props = $props()
  const copy = $derived(SECTION_COPY[key])
  const long = $derived(value.length > SECTION_MAX)
</script>

<!-- One optional part of "Something on my mind"; the count shows only near the limit. -->
<FormField
  id="hard-talk-{key}"
  label={copy.label}
  hint={showCounter(value) ? `${value.length} / ${SECTION_MAX}` : hint}
  error={long ? `Each part is at most ${SECTION_MAX} characters` : undefined}
>
  {#snippet control({ id, describedby, invalid })}
    <Textarea
      {id}
      {rows}
      placeholder={copy.placeholder}
      aria-invalid={invalid || undefined}
      aria-describedby={describedby}
      bind:value
    />
  {/snippet}
</FormField>
