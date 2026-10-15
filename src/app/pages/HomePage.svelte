<script lang="ts">
  import type { Space } from "@/features/spaces"
  let { space }: { space: Space } = $props()
</script>

<p class="text-muted-foreground">Coming together in {space.name}.</p>
