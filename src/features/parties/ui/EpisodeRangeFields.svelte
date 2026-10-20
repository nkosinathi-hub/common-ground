<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import type { StartFormState } from "./start-form-state.svelte"

  interface Props {
    fields: StartFormState
  }

  let { fields }: Props = $props()
</script>

<fieldset class="grid gap-3">
  <legend class="mb-1 text-sm font-medium">Episodes</legend>
  <div class="grid grid-cols-2 gap-3">
    <div class="grid gap-1.5">
      <Label for="party-from-season">From season</Label>
      <Input id="party-from-season" type="number" min="0" bind:value={fields.fromSeason} />
    </div>
    <div class="grid gap-1.5">
      <Label for="party-from-episode">From episode</Label>
      <Input id="party-from-episode" type="number" min="1" bind:value={fields.fromEpisode} />
    </div>
    <div class="grid gap-1.5">
      <Label for="party-to-season">To season</Label>
      <Input id="party-to-season" type="number" min="0" bind:value={fields.toSeason} />
    </div>
    <div class="grid gap-1.5">
      <Label for="party-to-episode">To episode</Label>
      <Input id="party-to-episode" type="number" min="1" bind:value={fields.toEpisode} />
    </div>
  </div>
  {#each fields.seasonsLeft as season (season)}
    <div class="grid gap-1.5">
      <Label for={`party-count-${season}`}>Episodes in season {season}</Label>
      <Input
        id={`party-count-${season}`}
        type="number"
        min="1"
        bind:value={fields.counts[season]}
      />
    </div>
  {/each}
</fieldset>
