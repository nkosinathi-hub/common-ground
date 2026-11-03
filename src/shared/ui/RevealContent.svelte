<script lang="ts">
  import type { Component, Snippet } from "svelte"

  interface Props {
    label: string
    icon?: Component
    leading?: Snippet
    compact?: boolean
    hintSide?: "top" | "bottom"
    touchLabel?: boolean
    align?: "start" | "end"
  }
  let {
    label,
    icon: Icon,
    leading,
    compact = false,
    hintSide = "bottom",
    touchLabel = false,
    align = "end",
  }: Props = $props()
</script>

<!-- The owning link or button supplies its accessible name even while the visual label is hidden. -->
<span
  data-reveal-surface
  data-compact={compact}
  data-hint-side={hintSide}
  data-touch-label={touchLabel}
  data-align={align}
>
  {#if Icon}<Icon class="size-5 shrink-0" aria-hidden="true" />{:else}{@render leading?.()}{/if}
  <span data-reveal-label aria-hidden="true">{label}</span>
</span>
