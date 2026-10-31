<script lang="ts">
  import { untrack } from "svelte"
  import { ThumbsDown, ThumbsUp } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import { Resource, toast } from "@/shared/ui"
  import type { Opinion } from "../domain/progress-types"
  import { useWatch } from "./context"

  interface Props {
    spaceId: string
    itemId: string
  }

  let { spaceId, itemId }: Props = $props()
  const { opinions } = useWatch()
  const current = new Resource(async () => opinions!.opinion(itemId))
  let saving = $state(false)
  const value = $derived(current.value ?? null)

  $effect(() => {
    void itemId
    if (opinions) untrack(() => void current.load())
  })

  async function choose(chosen: Opinion) {
    saving = true
    const saved = await opinions!.toggle(spaceId, itemId, value, chosen)
    saving = false
    if (!saved.ok) return toast.error(saved.error.message)
    void current.load()
  }

  const OPTIONS = [
    { value: "liked", label: "I liked it", icon: ThumbsUp },
    { value: "disliked", label: "Not for me", icon: ThumbsDown },
  ] as const
</script>

<!-- Rating toggle (295:10528): private, and it tunes what For you puts first for you alone. -->
{#if opinions}
  <div class="flex items-center gap-hairline" role="group" aria-label="Your verdict">
    {#each OPTIONS as option (option.value)}
      {@const on = value === option.value}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={option.label}
        aria-pressed={on}
        disabled={saving}
        class={cn(on && "bg-secondary text-primary")}
        onclick={() => choose(option.value)}
      >
        <option.icon class={cn(on && "fill-current")} />
      </Button>
    {/each}
  </div>
{/if}
