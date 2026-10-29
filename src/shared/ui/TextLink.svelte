<script lang="ts">
  import type { Component, Snippet } from "svelte"
  import { cn } from "$lib/utils"

  interface Props {
    href: string
    children: Snippet
    tone?: "primary" | "foreground"
    /** Trailing icon, e.g. ArrowRight for "See all". */
    icon?: Component
    class?: string
  }

  let { href, children, tone = "primary", icon: Icon, class: className }: Props = $props()
</script>

<a
  {href}
  class={cn(
    "inline-flex h-8 items-center gap-related rounded-sm type-label underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/20 pointer-coarse:h-11",
    tone === "primary" ? "text-primary" : "text-foreground",
    className,
  )}
>
  {@render children()}{#if Icon}<Icon class="size-4" aria-hidden="true" />{/if}
</a>
