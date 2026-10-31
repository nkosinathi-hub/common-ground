<script lang="ts">
  import type { Component } from "svelte"
  import { cn } from "$lib/utils"

  interface Props {
    icon: Component
    /** Shown when extended; otherwise the accessible name. */
    label: string
    extended?: boolean
    href?: string
    onclick?: () => void
    class?: string
  }

  let { icon: Icon, label, extended = false, href, onclick, class: className }: Props = $props()
  const classes = $derived(
    cn(
      "inline-flex h-14 shrink-0 items-center justify-center gap-related rounded-full bg-primary type-label text-primary-foreground shadow-fab outline-none transition-colors hover:bg-[color-mix(in_oklab,var(--primary),var(--foreground)_12%)] focus-visible:ring-3 focus-visible:ring-ring/30",
      extended ? "pr-5 pl-4" : "w-14",
      className,
    ),
  )
</script>

{#if href}
  <a {href} class={classes} aria-label={extended ? undefined : label}>
    <Icon class="size-6" aria-hidden="true" />{#if extended}{label}{/if}
  </a>
{:else}
  <button type="button" class={classes} aria-label={extended ? undefined : label} {onclick}>
    <Icon class="size-6" aria-hidden="true" />{#if extended}{label}{/if}
  </button>
{/if}
