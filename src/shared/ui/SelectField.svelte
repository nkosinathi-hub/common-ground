<script lang="ts" generics="T extends string">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import FormField from "./FormField.svelte"

  interface Props {
    id: string
    label: string
    value: T
    options: readonly { value: T; label: string }[]
    onchange: (value: T) => void
  }

  let { id, label, value, options, onchange }: Props = $props()
</script>

<!-- A labelled select in the Figma field rhythm: FormField around the native select. -->
<FormField {id} {label}>
  {#snippet control({ id: controlId, describedby })}
    <NativeSelect
      id={controlId}
      class="w-full"
      {value}
      aria-describedby={describedby}
      onchange={(event) => onchange(event.currentTarget.value as T)}
    >
      {#each options as option (option.value)}<option value={option.value}>{option.label}</option
        >{/each}
    </NativeSelect>
  {/snippet}
</FormField>
