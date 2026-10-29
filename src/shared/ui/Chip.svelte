<script lang="ts">
  import { X } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import { cn } from "$lib/utils"

  interface Props {
    children: Snippet
    /** Text for the remove button's name, e.g. the tag itself. */
    label?: string
    /** A toggle chip when set: pressed state, secondary fill and primary border. */
    selected?: boolean
    onclick?: () => void
    onremove?: () => void
    class?: string
  }

  let { children, label, selected, onclick, onremove, class: className }: Props = $props()
  const classes = $derived(
    cn(
      "inline-flex h-8 items-center gap-hairline rounded-full border px-item type-sm pointer-coarse:h-9",
      selected
        ? "border-primary bg-secondary text-secondary-foreground"
        : "border-border bg-card text-foreground",
      onclick && "outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/20",
      className,
    ),
  )
</script>

{#if onclick}
  <button type="button" class={classes} aria-pressed={selected} {onclick}>
    {@render children()}
  </button>
{:else}
  <span class={classes}>
    {@render children()}
    {#if onremove}
      <button
        type="button"
        class="-mr-1 inline-flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={label ? `Remove ${label}` : "Remove"}
        onclick={onremove}
      >
        <X class="size-3.5" aria-hidden="true" />
      </button>
    {/if}
  </span>
{/if}
