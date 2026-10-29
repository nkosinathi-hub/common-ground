<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import type { Component, Snippet } from "svelte"
  import { cn } from "$lib/utils"

  interface Props {
    title: string
    meta?: string
    /** A primary-coloured third line, e.g. "Up next: S2 E4". */
    detail?: string
    /** An icon in a 40 px muted tile; or pass `leading` for an avatar or poster. */
    icon?: Component
    leading?: Snippet
    trailing?: Snippet
    /** The whole row links here, with a chevron unless `trailing` is given. */
    href?: string
    /** Or the whole row is a button, such as one that opens a composer. */
    onclick?: () => void
    class?: string
  }

  let {
    title,
    meta,
    detail,
    icon: Icon,
    leading,
    trailing,
    href,
    onclick,
    class: className,
  }: Props = $props()
  const classes = $derived(
    cn(
      "flex min-h-16 items-center gap-item py-item text-left",
      (href || onclick) &&
        "rounded-md outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/20",
      className,
    ),
  )
</script>

{#snippet body()}
  {#if leading}{@render leading()}{:else if Icon}
    <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon class="size-5 text-foreground" aria-hidden="true" />
    </span>
  {/if}
  <span class="flex min-w-0 flex-1 flex-col">
    <span class="truncate type-label text-foreground">{title}</span>
    {#if meta}<span class="truncate type-xs text-muted-foreground">{meta}</span>{/if}
    {#if detail}<span class="truncate type-xs text-primary">{detail}</span>{/if}
  </span>
  {#if trailing}{@render trailing()}{:else if href || onclick}
    <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  {/if}
{/snippet}

{#if href}<a {href} class={classes}>{@render body()}</a>{:else if onclick}<button
    type="button"
    class="w-full {classes}"
    {onclick}>{@render body()}</button
  >{:else}<div class={classes}>
    {@render body()}
  </div>{/if}
