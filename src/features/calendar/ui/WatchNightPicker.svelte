<script lang="ts">
  import { NativeSelect } from "$lib/components/ui/native-select"
  import { untrack } from "svelte"
  import { Popcorn } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { Resource } from "@/shared/ui"
  import type { LinkOption } from "../application/ports"
  import { useCalendar } from "./context"

  interface Props {
    spaceId: string
    expanded: boolean
    onPick: (title: LinkOption) => void
  }

  let { spaceId, expanded = false, onPick }: Props = $props()
  const { service } = useCalendar()
  let showing = $state(untrack(() => expanded))
  const queue = new Resource(() => service.watchNight(untrack(() => spaceId)))
  $effect(() => {
    if (showing) void queue.load()
  })

  function pick(id: string) {
    const title = queue.value?.find((option) => option.id === id)
    if (title) onPick(title)
  }
</script>

{#if !showing}
  <Button
    type="button"
    variant="outline"
    class="justify-self-start"
    onclick={() => (showing = true)}
  >
    <Popcorn aria-hidden="true" />Plan a watch night
  </Button>
{:else if queue.state.status === "ready" && queue.state.value.length === 0}
  <p class="text-sm text-muted-foreground">
    Nothing on your watch-together list yet. Mark a title "Watch together" to plan it here.
  </p>
{:else}
  <div class="grid gap-1.5">
    <Label for="watch-night-title">Watch together</Label>
    <NativeSelect
      id="watch-night-title"
      disabled={queue.state.status !== "ready"}
      onchange={(event) => pick(event.currentTarget.value)}
    >
      <option value="">Choose a title</option>
      {#each queue.value ?? [] as title (title.id)}
        <option value={title.id}>{title.label}</option>
      {/each}
    </NativeSelect>
  </div>
{/if}
