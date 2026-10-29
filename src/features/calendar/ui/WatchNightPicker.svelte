<script lang="ts">
  import { untrack } from "svelte"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Label } from "$lib/components/ui/label"
  import { Resource, SelectField } from "@/shared/ui"
  import type { LinkOption } from "../application/ports"
  import { useCalendar } from "./context"

  interface Props {
    spaceId: string
    onPick: (title: LinkOption) => void
  }

  let { spaceId, onPick }: Props = $props()
  const { service } = useCalendar()
  let showing = $state(false)
  let picked = $state("")
  const queue = new Resource(() => service.watchNight(untrack(() => spaceId)))
  $effect(() => {
    if (showing) void queue.load()
  })
  const options = $derived([
    { value: "", label: "Choose a title" },
    ...(queue.value ?? []).map((title) => ({ value: title.id, label: title.label })),
  ])

  function pick(id: string) {
    picked = id
    const title = queue.value?.find((option) => option.id === id)
    if (title) onPick(title)
  }
</script>

<!-- S06c "Plan a watch night": a title from the watch-together list sets the plan up. -->
<div class="flex items-center gap-related">
  <Checkbox id="watch-night" bind:checked={showing} />
  <Label for="watch-night" class="type-sm">Plan a watch night</Label>
</div>
{#if showing}
  {#if queue.state.status === "ready" && queue.state.value.length === 0}
    <p class="type-sm text-muted-foreground">
      Nothing on your watch-together list yet. Mark a title "Watch together" to plan it here.
    </p>
  {:else}
    <SelectField
      id="watch-night-title"
      label="Watch together"
      value={picked}
      {options}
      onchange={pick}
    />
  {/if}
{/if}
