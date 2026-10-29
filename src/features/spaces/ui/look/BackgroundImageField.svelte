<script lang="ts">
  import { ImageIcon } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Dropzone } from "@/shared/ui"
  import FocalPoint from "./FocalPoint.svelte"

  interface Props {
    /** The uploaded picture's URL, or null before there is one. */
    picture: string | null
    focusX: number
    focusY: number
    busy?: boolean
    onfile: (file: File) => void
    onremove: () => void
    onfocus: (x: number, y: number) => void
  }

  let { picture, focusX, focusY, busy = false, onfile, onremove, onfocus }: Props = $props()
  let input = $state<HTMLInputElement>()
</script>

<!-- Figma Background image field (238:8452): the Dropzone until there is a picture, then the picture with its focal point. -->
{#if !picture}
  <Dropzone
    title="No picture yet"
    description="A photo behind the whole space, softened so text stays readable."
    hint="JPEG, PNG or WebP, up to 5 MB"
    actionLabel="Choose a picture"
    accept="image/jpeg,image/png,image/webp"
    icon={ImageIcon}
    disabled={busy}
    onfiles={(files: File[]) => files[0] && onfile(files[0])}
  />
{:else}
  <div class="flex flex-col gap-inset rounded-md border border-border p-item sm:flex-row">
    <FocalPoint {picture} x={focusX} y={focusY} onmove={onfocus} />
    <div class="flex flex-col gap-item">
      <p class="type-sm text-muted-foreground">Drag the dot to keep the best part in view.</p>
      <div class="flex gap-related">
        <Button variant="outline" size="sm" disabled={busy} onclick={() => input?.click()}
          >Replace</Button
        >
        <Button variant="ghost" size="sm" disabled={busy} onclick={onremove}>Remove</Button>
      </div>
    </div>
    <input
      bind:this={input}
      type="file"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      accept="image/jpeg,image/png,image/webp"
      onchange={(e) => {
        const file = e.currentTarget.files?.[0]
        if (file) onfile(file)
        e.currentTarget.value = ""
      }}
    />
  </div>
{/if}
