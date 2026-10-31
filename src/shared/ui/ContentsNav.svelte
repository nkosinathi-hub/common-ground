<script lang="ts">
  import { cn } from "$lib/utils"

  interface Item {
    readonly href: string
    readonly label: string
    /** Tells apart parts that share a link; defaults to the href. */
    readonly id?: string
  }

  interface Props {
    items: readonly Item[]
    /** The id (or href) of the part on screen. */
    current: string
    label?: string
    class?: string
  }

  let { items, current, label = "Contents", class: className }: Props = $props()
</script>

<!-- Figma Contents link (211:9107): a left rule that turns primary on the current part. -->
<nav aria-label={label} class={cn("flex flex-col", className)}>
  {#each items as item (item.id ?? item.href)}
    {@const active = (item.id ?? item.href) === current}
    <a
      href={item.href}
      aria-current={active ? "location" : undefined}
      class={cn(
        "border-l-2 py-1.5 pl-item outline-none focus-visible:ring-3 focus-visible:ring-ring/20",
        active
          ? "border-primary type-label-sm text-foreground"
          : "border-border type-sm text-muted-foreground hover:text-foreground",
      )}>{item.label}</a
    >
  {/each}
</nav>
