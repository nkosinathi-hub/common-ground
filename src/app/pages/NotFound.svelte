<script lang="ts">
  import { SearchX } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { EmptyState } from "@/shared/ui"
</script>

<main class="mx-auto max-w-lg px-4 py-16">
  <EmptyState
    icon={SearchX}
    title="This page is not available"
    description="It may have been removed, or it belongs to a space you are not part of."
  >
    <Button href="#/">Go to my spaces</Button>
  </EmptyState>
</main>
