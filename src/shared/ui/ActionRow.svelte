<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    title: string
    description?: string
    /** The control, usually one outline sm button. */
    action: Snippet
    id?: string
  }

  let { title, description, action, id }: Props = $props()
</script>

<div class="flex flex-col gap-item sm:flex-row sm:items-center sm:gap-columns">
  <div class="flex min-w-0 flex-1 flex-col gap-hairline">
    <p {id} class="type-label text-foreground">{title}</p>
    {#if description}<p class="type-sm text-muted-foreground">{description}</p>{/if}
  </div>
  <div class="flex shrink-0 gap-related">{@render action()}</div>
</div>
