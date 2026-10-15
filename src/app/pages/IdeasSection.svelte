<script lang="ts">
  import type { Space } from "@/features/spaces"
  let { space, route }: { space: Space; route: unknown } = $props()
</script>

<p class="text-muted-foreground">Coming together in {space.name}.{route ? "" : ""}</p>
