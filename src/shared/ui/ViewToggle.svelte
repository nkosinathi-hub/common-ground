<script lang="ts" generics="T extends string">
  import type { Component } from "svelte"
  import * as ToggleGroup from "$lib/components/ui/toggle-group"
  import { cn } from "$lib/utils"

  interface Props {
    value: T
    options: readonly { value: T; label: string; icon?: Component }[]
    onchange: (value: T) => void
    class?: string
  }

  let { value, options, onchange, class: className }: Props = $props()
</script>

<!-- The segmented control (Figma Segmented control) for switching views: List, Kanban, Board. -->
<ToggleGroup.Root
  type="single"
  variant="segment"
  spacing={1}
  aria-label="View"
  class={cn("w-fit!", className)}
  {value}
  onValueChange={(next) => next && onchange(next as T)}
>
  {#each options as option (option.value)}
    <ToggleGroup.Item value={option.value}>
      {#if option.icon}<option.icon aria-hidden="true" />{/if}{option.label}
    </ToggleGroup.Item>
  {/each}
</ToggleGroup.Root>
