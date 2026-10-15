<script lang="ts">
  import { Skeleton } from "$lib/components/ui/skeleton"

  let { rows = 3, label = "Loading" }: { rows?: number; label?: string } = $props()
</script>

<div class="flex flex-col gap-3" role="status" aria-live="polite">
  <span class="sr-only">{label}</span>
  {#each Array.from({ length: rows }, (_, i) => i) as i (i)}
    <Skeleton class="h-16 w-full rounded-xl" />
  {/each}
</div>
