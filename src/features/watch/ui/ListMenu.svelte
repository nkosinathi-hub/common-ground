<script lang="ts">
  import { Bookmark, ChevronDown } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import { toast } from "@/shared/ui"
  import { INTENTS, intentLabel } from "../domain/labels"
  import type { SharedIntent, WatchItem } from "../domain/types"
  import { useWatch } from "./context"

  interface Props {
    item: WatchItem
    onChanged: () => void
  }

  let { item, onChanged }: Props = $props()
  const { service } = useWatch()

  async function choose(intent: string) {
    if (intent === item.intent) return
    const result = await service.setIntent(item.id, intent as SharedIntent)
    if (!result.ok) return toast.error(result.error.message)
    toast.success("List updated")
    onChanged()
  }
</script>

<!-- The shared list as a small bookmark menu on the meta line. -->
<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="sm"
        class="px-related text-primary"
        aria-label="List: {intentLabel(item.intent)}"
      >
        <Bookmark aria-hidden="true" />{intentLabel(item.intent)}<ChevronDown aria-hidden="true" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start">
    <DropdownMenu.RadioGroup value={item.intent} onValueChange={choose}>
      {#each INTENTS as intent (intent.value)}
        <DropdownMenu.RadioItem value={intent.value}>{intent.label}</DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
