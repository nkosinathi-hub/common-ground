<script lang="ts">
  import type { Component, Snippet } from "svelte"
  import { cn } from "$lib/utils"
  import Illustration from "./Illustration.svelte"

  interface Props {
    icon?: Component
    title: string
    description?: string
    illustration?: boolean
    /** Use 1 when the empty state is the whole page, e.g. not-found. */
    level?: 1 | 2 | 3
    /** Muted is the Figma Empty state (211:6430), inside a card; page sits on the background. */
    tone?: "muted" | "page"
    children?: Snippet
  }

  let {
    icon: Icon,
    title,
    description,
    illustration = false,
    level = 2,
    tone = "muted",
    children,
  }: Props = $props()
</script>

<div
  class={cn(
    "flex flex-col items-center gap-related rounded-md px-inset text-center",
    tone === "muted" ? "bg-muted py-card" : "py-section",
  )}
>
  {#if illustration}
    <Illustration class="h-28" />
  {:else if Icon}
    <Icon class="size-4 text-muted-foreground" aria-hidden="true" />
  {/if}
  <svelte:element this={`h${level}`} class={tone === "page" ? "type-h2" : "type-label"}>
    {title}
  </svelte:element>
  {#if description}<p class="max-w-prose type-sm text-muted-foreground">{description}</p>{/if}
  {#if children}<div class="mt-hairline flex flex-wrap justify-center gap-related">
      {@render children()}
    </div>{/if}
</div>
