<script lang="ts">
  import { EyeOff } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"

  let { text, onShow }: { text: string; onShow: () => void } = $props()
</script>

<!-- Spoiler notice (287:9566): counted, never shown, until you ask; Show lasts this visit. -->
<div class="flex items-center gap-item rounded-md bg-muted px-item py-related" role="status">
  <EyeOff class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  <p class="min-w-0 flex-1 type-sm text-muted-foreground">{text}</p>
  <Button variant="ghost" size="sm" class="text-primary" onclick={onShow}>Show</Button>
</div>
