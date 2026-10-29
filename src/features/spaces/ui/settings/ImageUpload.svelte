<script lang="ts">
  import { Image as ImageIcon, ImagePlus } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Dropzone } from "@/shared/ui"
  import type { MediaSlot } from "../../domain/media"
  import { iconFor } from "../icons"

  const ACCEPT = "image/jpeg,image/png,image/webp"
  const COPY = {
    avatar: { title: "Space picture", where: "Shown in the space switcher and on Home." },
    cover: { title: "Cover", where: "Shown at the top of Home." },
  }

  interface Props {
    kind: MediaSlot
    /** The current picture's signed URL, if any. */
    url: string | null
    busy: boolean
    onPick: (file: File) => void
    onRemove: () => void
    /** The space's icon, shown while there is no picture. */
    icon?: string | null
  }

  let { kind, url, busy, onPick, onRemove, icon = null }: Props = $props()
  const Fallback = $derived(iconFor(icon) ?? ImagePlus)
  const copy = $derived(COPY[kind as keyof typeof COPY])
  const noun = $derived(kind === "avatar" ? "picture" : "cover")
  let input = $state<HTMLInputElement>()

  function picked(event: Event & { currentTarget: HTMLInputElement }) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (file) onPick(file)
  }
</script>

<!-- Figma D15a Pictures row: the picture, what it is for, then Replace and Remove; an empty
     cover is a drop zone (D15a), an empty picture an Add button. -->
{#if kind === "cover" && !url}
  <Dropzone
    icon={ImageIcon}
    title="No cover added"
    description="A wide image works best."
    actionLabel="Add cover"
    accept={ACCEPT}
    disabled={busy}
    inputLabel="Choose a cover"
    onfiles={([file]) => file && onPick(file)}
  />
{:else}
  <div class="flex flex-wrap items-center gap-item">
    <div
      class="grid shrink-0 place-items-center overflow-hidden bg-muted {kind === 'avatar'
        ? 'size-10 rounded-full'
        : 'h-10 w-18 rounded-md'}"
    >
      {#if url}<img src={url} alt="Current {noun}" class="size-full object-cover" />
      {:else}<Fallback class="size-4 text-muted-foreground" aria-hidden="true" />{/if}
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <span class="type-label text-foreground">{copy.title}</span>
      <span class="type-xs text-muted-foreground">{copy.where}</span>
    </div>
    <input
      bind:this={input}
      type="file"
      accept={ACCEPT}
      class="sr-only"
      aria-label="Choose a {noun}"
      onchange={picked}
      disabled={busy}
    />
    <Button variant="outline" size="sm" disabled={busy} onclick={() => input?.click()}>
      {url ? "Replace" : `Add ${noun}`}
    </Button>
    {#if url}
      <Button
        variant="link"
        size="sm"
        class="px-0"
        aria-label="Remove {noun}"
        disabled={busy}
        onclick={onRemove}>Remove</Button
      >
    {/if}
  </div>
{/if}
