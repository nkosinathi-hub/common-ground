<script lang="ts">
  interface Props {
    /** Display names, author first. */
    names: readonly string[]
  }

  const SHOWN = 3

  let { names }: Props = $props()
  const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?"
  const extra = $derived(names.length - SHOWN)
</script>

{#if names.length > 0}
  <span
    role="img"
    aria-label="On this idea: {names.join(', ')}"
    class="flex items-center -space-x-1"
  >
    {#each names.slice(0, SHOWN) as name, index (index)}
      <span
        aria-hidden="true"
        class="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
        >{initial(name)}</span
      >
    {/each}
    {#if extra > 0}
      <span aria-hidden="true" class="pl-2 text-xs text-muted-foreground">+{extra}</span>
    {/if}
  </span>
{/if}
