<script lang="ts">
  import { CircleAlert, Lock, SearchX, WifiOff } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import type { AppError } from "@/shared/domain"

  let { error, onRetry }: { error: AppError; onRetry?: () => void } = $props()

  const view = $derived.by(() => {
    switch (error.kind) {
      case "denied":
        return { icon: Lock, title: "You do not have access to this", retry: false }
      case "not_found":
        return { icon: SearchX, title: "This is not available", retry: false }
      case "network":
        return { icon: WifiOff, title: "You seem to be offline", retry: true }
      default:
        return { icon: CircleAlert, title: "Something went wrong", retry: true }
    }
  })
</script>

<div role="alert" class="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center">
  <view.icon class="size-6 text-muted-foreground" aria-hidden="true" />
  <h2 class="font-semibold">{view.title}</h2>
  <p class="text-sm text-muted-foreground">{error.message}</p>
  {#if onRetry && view.retry}<Button variant="outline" onclick={onRetry}>Try again</Button>{/if}
</div>
