<script lang="ts">
  import type { AddedTitle } from "./add-title-state.svelte"

  interface Props {
    items: AddedTitle[]
    href: (id: string) => string
  }

  let { items, href }: Props = $props()
</script>

<!-- One live region announces each add; it stays mounted so the first add is heard too. -->
<p role="status" class="type-sm text-muted-foreground empty:hidden">
  {#if items.length > 0}
    Added:
    {#each items as item, index (item.id)}
      <a class="font-medium text-foreground underline underline-offset-4" href={href(item.id)}
        >{item.title}</a
      >{index < items.length - 1 ? ", " : ""}
    {/each}
  {/if}
</p>
