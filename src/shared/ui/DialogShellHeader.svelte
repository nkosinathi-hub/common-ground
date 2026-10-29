<script lang="ts">
  import { X } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Dialog from "$lib/components/ui/dialog"

  let { title, description, header }: { title: string; description?: string; header?: Snippet } =
    $props()
</script>

<!-- The dialog header: h2 title, description, close; then any tabs under it. -->
<div class="flex flex-col gap-stack px-6 pt-6">
  <div class="flex items-start gap-inset">
    <div class="flex min-w-0 flex-1 flex-col gap-related">
      <Dialog.Title class="type-h2 text-foreground">{title}</Dialog.Title>
      {#if description}
        <Dialog.Description class="type-sm text-muted-foreground">{description}</Dialog.Description>
      {/if}
    </div>
    <Dialog.Close>
      {#snippet child({ props })}
        <Button {...props} variant="ghost" size="icon-sm" aria-label="Close"><X /></Button>
      {/snippet}
    </Dialog.Close>
  </div>
  {@render header?.()}
</div>
