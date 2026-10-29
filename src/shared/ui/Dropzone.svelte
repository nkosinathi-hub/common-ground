<script lang="ts">
  import { Paperclip } from "@lucide/svelte"
  import type { Component } from "svelte"
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"

  interface Props {
    title: string
    description?: string
    /** Accepted types and size, e.g. "JPEG, PNG, WebP or PDF, up to 10 MB each". */
    hint?: string
    actionLabel?: string
    accept?: string
    multiple?: boolean
    disabled?: boolean
    icon?: Component
    onfiles: (files: File[]) => void
    /** Names the hidden file input for tests and assistive tech that reach it directly. */
    inputLabel?: string
  }

  let {
    title,
    description,
    hint,
    actionLabel = "Choose files",
    accept,
    multiple = false,
    disabled = false,
    icon: Icon = Paperclip,
    inputLabel,
    onfiles,
  }: Props = $props()
  let input = $state<HTMLInputElement>()
  let over = $state(false)

  function take(list: FileList | null | undefined) {
    const files = [...(list ?? [])]
    if (files.length && !disabled) onfiles(multiple ? files : files.slice(0, 1))
  }
</script>

<!-- Figma Dropzone (210:4444): drop files on it, or choose them with the button. -->
<div
  role="group"
  aria-label={title}
  class={cn(
    "flex flex-col items-center gap-related rounded-md border border-dashed border-border p-card text-center transition-colors",
    over && "border-primary bg-secondary",
  )}
  ondragover={(event) => (event.preventDefault(), (over = true))}
  ondragleave={() => (over = false)}
  ondrop={(event) => (event.preventDefault(), (over = false), take(event.dataTransfer?.files))}
>
  <Icon class="size-5 text-muted-foreground" aria-hidden="true" />
  <p class="type-label text-foreground">{title}</p>
  {#if description}<p class="max-w-prose type-sm text-muted-foreground">{description}</p>{/if}
  <Button variant="outline" size="sm" {disabled} onclick={() => input?.click()}>
    {actionLabel}
  </Button>
  {#if hint}<p class="type-xs text-muted-foreground">{hint}</p>{/if}
  <input
    bind:this={input}
    type="file"
    class="sr-only"
    tabindex="-1"
    aria-hidden={inputLabel ? undefined : "true"}
    aria-label={inputLabel}
    {accept}
    {multiple}
    onchange={(event) => (take(event.currentTarget.files), (event.currentTarget.value = ""))}
  />
</div>
