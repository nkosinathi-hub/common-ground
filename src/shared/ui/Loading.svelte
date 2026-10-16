<script lang="ts">
  import { Skeleton } from "$lib/components/ui/skeleton"

  interface Props {
    rows?: number
    label?: string
  }

  let { rows = 3, label = "Loading" }: Props = $props()
</script>

<div class="flex flex-col gap-3" role="status" aria-live="polite">
  <span class="sr-only">{label}</span>
  {#each Array.from({ length: rows }, (_, i) => i) as i (i)}
    <Skeleton class="h-16 w-full rounded-xl" />
  {/each}
</div>
