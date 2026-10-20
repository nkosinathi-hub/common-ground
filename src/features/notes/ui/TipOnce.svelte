<script lang="ts">
  import { untrack } from "svelte"
  import { Lightbulb } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { remembered } from "./remembered"

  interface Props {
    /** Device-store key that remembers the tip was dismissed on this device. */
    storageKey: string
    text: string
  }

  let { storageKey, text }: Props = $props()
  const dismissed = remembered(untrack(() => storageKey))
  let shown = $state(!dismissed.get())

  function dismiss() {
    dismissed.set(true)
    shown = false
  }
</script>

{#if shown}
  <aside class="flex items-start gap-2 rounded-lg bg-highlight p-3 text-sm" aria-label="Tip">
    <Lightbulb class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    <p class="flex-1">{text}</p>
    <Button size="sm" variant="ghost" class="min-h-11" onclick={dismiss}>Got it</Button>
  </aside>
{/if}
