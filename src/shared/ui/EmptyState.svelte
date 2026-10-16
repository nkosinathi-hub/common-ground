<script lang="ts">
  import type { Component, Snippet } from "svelte"
  import Illustration from "./Illustration.svelte"

  interface Props {
    icon?: Component
    title: string
    description?: string
    illustration?: boolean
    /** Use 1 when the empty state is the whole page, e.g. not-found. */
    level?: 1 | 2
    children?: Snippet
  }

  let {
    icon: Icon,
    title,
    description,
    illustration = false,
    level = 2,
    children,
  }: Props = $props()
</script>

<div
  class="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center"
>
  {#if illustration}
    <Illustration class="h-28" />
  {:else if Icon}
    <div class="rounded-full bg-accent p-3 text-primary">
      <Icon class="size-6" aria-hidden="true" />
    </div>
  {/if}
  <svelte:element this={`h${level}`} class="text-lg font-semibold">{title}</svelte:element>
  {#if description}<p class="max-w-sm text-sm text-muted-foreground">{description}</p>{/if}
  {#if children}<div class="mt-2 flex flex-wrap justify-center gap-2">
      {@render children()}
    </div>{/if}
</div>
