<script lang="ts">
  import { Progress } from "$lib/components/ui/progress"
  import { cn } from "$lib/utils"
  import { InitialAvatar } from "@/shared/ui"
  import type { MemberRow } from "../domain/title-facts"

  let { row }: { row: MemberRow } = $props()
</script>

<!-- Member progress row (290:9980): who, where, and a slim bar through their own season. -->
<li class="flex flex-col gap-related py-related">
  <div class="flex items-center gap-item">
    <InitialAvatar name={row.name} size="sm" tone={row.me ? "brand" : "secondary"} decorative />
    <span class="min-w-0 flex-1 truncate type-sm text-foreground">{row.name}</span>
    {#if row.place}
      <span class={cn("type-label-sm", row.ahead ? "text-primary" : "text-muted-foreground")}
        >{row.place}</span
      >
    {/if}
  </div>
  <Progress
    value={Math.round(row.fraction * 100)}
    class="ml-9 h-1 w-auto"
    aria-label="{row.name}: {row.place ?? 'not started'}"
  />
</li>
