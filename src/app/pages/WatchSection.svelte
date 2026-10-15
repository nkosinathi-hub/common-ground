<script lang="ts">
  import type { Space } from "@/features/spaces"
  let { space, itemId }: { space: Space; itemId: string | null } = $props()
</script>

<p class="text-muted-foreground">Coming together in {space.name}.{String(itemId ?? "")}</p>
