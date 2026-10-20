<script lang="ts" generics="T extends string">
  import type { Component } from "svelte"
  import { Button } from "$lib/components/ui/button"

  interface Props {
    value: T
    options: readonly { value: T; label: string; icon: Component }[]
    onchange: (value: T) => void
  }

  let { value, options, onchange }: Props = $props()
</script>

<div class="flex gap-1" role="group" aria-label="View">
  {#each options as option (option.value)}
    <Button
      size="sm"
      variant={value === option.value ? "default" : "outline"}
      aria-pressed={value === option.value}
      onclick={() => onchange(option.value)}><option.icon />{option.label}</Button
    >
  {/each}
</div>
