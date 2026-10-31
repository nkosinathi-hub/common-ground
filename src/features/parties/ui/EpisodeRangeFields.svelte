<script lang="ts">
  import { Input } from "$lib/components/ui/input"
  import { Label } from "$lib/components/ui/label"
  import type { StartFormState } from "./start-form-state.svelte"

  interface Props {
    fields: StartFormState
  }

  let { fields }: Props = $props()
</script>

<!-- Figma S05 Episode range: from and to, four fields in a row on wide screens. -->
<fieldset class="flex flex-col gap-stack">
  <legend class="sr-only">Episodes</legend>
  <div class="grid grid-cols-2 gap-stack sm:grid-cols-4">
    <div class="flex flex-col gap-related">
      <Label for="party-from-season">From season</Label>
      <Input id="party-from-season" type="number" min="0" bind:value={fields.fromSeason} />
    </div>
    <div class="flex flex-col gap-related">
      <Label for="party-from-episode">From episode</Label>
      <Input id="party-from-episode" type="number" min="1" bind:value={fields.fromEpisode} />
    </div>
    <div class="flex flex-col gap-related">
      <Label for="party-to-season">To season</Label>
      <Input id="party-to-season" type="number" min="0" bind:value={fields.toSeason} />
    </div>
    <div class="flex flex-col gap-related">
      <Label for="party-to-episode">To episode</Label>
      <Input id="party-to-episode" type="number" min="1" bind:value={fields.toEpisode} />
    </div>
  </div>
  {#each fields.seasonsLeft as season (season)}
    <div class="flex flex-col gap-related">
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
