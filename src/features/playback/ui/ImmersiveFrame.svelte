<script lang="ts">
  import { Dialog } from "bits-ui"
  import type { Snippet } from "svelte"
  let {
    active,
    title,
    onclose,
    children,
  }: {
    active: boolean
    title: string
    onclose: () => void
    children: Snippet
  } = $props()
</script>

{#if active}
  <Dialog.Root open onOpenChange={(open) => !open && onclose()}>
    <Dialog.Portal>
      <Dialog.Content
        aria-describedby={undefined}
        class="dark fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto bg-black px-[max(1rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-white outline-none"
      >
        <Dialog.Title class="sr-only">Watching {title}</Dialog.Title>
        {@render children()}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{:else}
  {@render children()}
{/if}
