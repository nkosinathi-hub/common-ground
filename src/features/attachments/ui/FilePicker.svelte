<script lang="ts">
  import { Upload } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { ACCEPT } from "../domain/rules"

  interface Props {
    disabled: boolean
    onPick: (file: File) => void
  }
  let { disabled, onPick }: Props = $props()

  let input = $state<HTMLInputElement | null>(null)

  function picked(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (file) onPick(file)
  }
</script>

<!-- Once there are files: one small button in the card's title line; types are re-checked after upload. -->
<Button size="sm" variant="outline" {disabled} onclick={() => input?.click()}>
  <Upload aria-hidden="true" />Attach a file
</Button>
<input
  bind:this={input}
  type="file"
  class="sr-only"
  tabindex={-1}
  accept={ACCEPT}
  aria-label="Choose a file to attach"
  onchange={picked}
/>
