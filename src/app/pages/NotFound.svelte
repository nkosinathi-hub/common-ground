<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { EmptyState, PublicLayout } from "@/shared/ui"
</script>

<!-- No frame: the public layout's header, then the empty state with the way back. -->
<PublicLayout>
  <section
    class="w-full max-w-auth rounded-lg border border-border bg-card p-card shadow-sm sm:p-card-auth"
  >
    <EmptyState
      illustration
      level={1}
      tone="page"
      title="This page is not available"
      description="It may have been removed, or it belongs to a space you are not part of."
    >
      <Button href="#/">Go to my spaces</Button>
    </EmptyState>
  </section>
</PublicLayout>
