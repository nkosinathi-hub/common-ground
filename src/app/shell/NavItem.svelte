<script lang="ts">
  import type { Component } from "svelte"
  import { cn } from "$lib/utils"

  interface Props {
    href: string
    label: string
    icon: Component
    active: boolean
  }

  let { href, label, icon: Icon, active }: Props = $props()
</script>

<!-- Figma Nav item / Desktop (208:3148): the active item fills with the rail's ink. -->
<a
  {href}
  aria-current={active ? "page" : undefined}
  class={cn(
    "flex h-10 items-center gap-item rounded-md px-item transition-colors outline-none focus-visible:ring-3 focus-visible:ring-sidebar-foreground/40",
    active
      ? "bg-sidebar-foreground type-label text-sidebar"
      : "type-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  )}
>
  <Icon class="size-4" aria-hidden="true" />{label}
</a>
