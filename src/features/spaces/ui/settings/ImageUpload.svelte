<script lang="ts">
  import { ImagePlus, Trash2 } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import type { MediaSlot } from "../../domain/media"

  interface Props {
    kind: MediaSlot
    label: string
    /** The current picture's signed URL, if any. */
    url: string | null
    busy: boolean
    onPick: (file: File) => void
    onRemove: () => void
  }

  let { kind, label, url, busy, onPick, onRemove }: Props = $props()
  let input = $state<HTMLInputElement>()
  const id = $derived(`space-${kind}-file`)

  function picked(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (file) onPick(file)
  }
</script>

<div class="grid gap-2">
  <span class="text-sm font-medium">{label}</span>
  <div
    class={cn(
      "grid place-items-center overflow-hidden rounded-lg border bg-muted",
      kind === "avatar" ? "size-24" : "aspect-[3/1] w-full max-w-md",
    )}
  >
    {#if url}
      <img src={url} alt={`Current ${label.toLowerCase()}`} class="size-full object-cover" />
    {:else}
      <ImagePlus class="size-6 text-muted-foreground" aria-hidden="true" />
    {/if}
  </div>
  <div class="flex flex-wrap gap-2">
    <input
      bind:this={input}
      {id}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="sr-only"
      aria-label={`Choose a ${label.toLowerCase()}`}
      onchange={picked}
      disabled={busy}
    />
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      onclick={() => input?.click()}
    >
      {url ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
    </Button>
    {#if url}
      <Button type="button" variant="ghost" size="sm" disabled={busy} onclick={onRemove}>
        <Trash2 class="size-4" aria-hidden="true" />Remove {label.toLowerCase()}
      </Button>
    {/if}
  </div>
</div>
