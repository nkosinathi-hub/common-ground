<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { changedFields, type Brief, type BriefField, type Idea } from "../domain"
  import { BRIEF_LABELS } from "./labels"

  type Side = "mine" | "theirs"

  interface Props {
    mine: Brief
    latest: Idea
    onResolve: (merged: Brief) => void
    onCancel: () => void
  }

  let { mine, latest, onResolve, onCancel }: Props = $props()

  const fields = $derived(changedFields(mine, latest.brief))
  let choice = $state<Partial<Record<BriefField, Side>>>({})

  const sides = (field: BriefField): [Side, string, string | undefined][] => [
    ["mine", "Your version", mine[field]],
    ["theirs", "Their version", latest.brief[field]],
  ]
  const chosen = (field: BriefField): Side => choice[field] ?? "mine"

  function resolve() {
    const merged: Brief = { ...latest.brief }
    for (const field of fields)
      merged[field] = chosen(field) === "mine" ? mine[field] : latest.brief[field]
    onResolve(merged)
  }
</script>

<Card.Root role="alertdialog" aria-labelledby="merge-title" data-testid="brief-merge">
  <Card.Header>
    <Card.Title id="merge-title">Someone else saved this overview while you were editing</Card.Title
    >
    <Card.Description
      >Choose which version to keep for each field that differs. Nothing is lost.</Card.Description
    >
  </Card.Header>
  <Card.Content class="flex flex-col gap-4">
    {#each fields as field (field)}
      <fieldset class="flex flex-col gap-2">
        <legend class="text-sm font-medium">{BRIEF_LABELS[field]}</legend>
        {#each sides(field) as [key, label, text] (key)}
          <label class="flex items-start gap-2 rounded-md border p-2 text-sm">
            <input
              type="radio"
              name={field}
              value={key}
              checked={chosen(field) === key}
              onchange={() => (choice = { ...choice, [field]: key })}
            />
            <span><span class="font-medium">{label}:</span> {text || "(empty)"}</span>
          </label>
        {/each}
      </fieldset>
    {/each}
  </Card.Content>
  <Card.Footer class="gap-2">
    <Button onclick={resolve}>Save merged overview</Button>
    <Button variant="outline" onclick={onCancel}>Keep editing</Button>
  </Card.Footer>
</Card.Root>
