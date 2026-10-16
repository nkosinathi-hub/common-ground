<!--
  Two people meeting under a shared arch on a small rise of ground. Decorative only. Every shape
  is painted with theme tokens, so it follows light and dark mode and each space's accents.
  Static on purpose: nothing to switch off for prefers-reduced-motion.
-->
<script lang="ts">
  import { cn } from "$lib/utils"

  interface Props {
    class?: string
  }

  let { class: className = "" }: Props = $props()
</script>

<svg
  viewBox="0 0 160 100"
  aria-hidden="true"
  focusable="false"
  class={cn("h-24 w-auto", className)}
  xmlns="http://www.w3.org/2000/svg"
>
  <circle cx="128" cy="24" r="11" class="fill-clay/25" />
  <path d="M0 92 Q80 60 160 92 V100 H0 Z" class="fill-primary/15" />
  <path
    d="M52 34 Q80 6 108 34"
    fill="none"
    stroke-width="3"
    stroke-linecap="round"
    class="stroke-primary"
  />
  <path d="M46 84 Q46 58 60 58 Q74 58 74 84 Z" class="fill-primary" />
  <circle cx="60" cy="47" r="8" class="fill-clay" />
  <path d="M86 84 Q86 58 100 58 Q114 58 114 84 Z" class="fill-clay" />
  <circle cx="100" cy="47" r="8" class="fill-primary" />
  <circle cx="80" cy="66" r="3" class="fill-highlight stroke-clay" stroke-width="1.5" />
</svg>
