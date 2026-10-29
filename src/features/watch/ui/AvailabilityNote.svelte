<script lang="ts">
  import { SquarePen } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import type { WatchItem } from "../domain/types"
  import EditTitleDialog from "./EditTitleDialog.svelte"

  interface Props {
    item: WatchItem
    onChanged: () => void
  }

  let { item, onChanged }: Props = $props()
  let editing = $state(false)
  // Both tabs may hold this card at once, so each copy names its own heading.
  const uid = $props.id()
  const heading = `${uid}-heading`
</script>

<!-- D03b "Our availability note": the space's own note; its edit icon opens the title's details. -->
<Card.Root role="region" aria-labelledby={heading}>
  <Card.Header>
    <Card.Title id={heading}>Our availability note</Card.Title>
    <Card.Action>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit details"
        onclick={() => (editing = true)}
      >
        <SquarePen />
      </Button>
    </Card.Action>
  </Card.Header>
  <Card.Content class="flex flex-col gap-related">
    <p class="type-body text-foreground">{item.availabilityNote ?? "No availability note yet."}</p>
    <p class="type-xs text-muted-foreground">Added by a member, not a provider listing.</p>
  </Card.Content>
</Card.Root>

<EditTitleDialog bind:open={editing} {item} onSaved={onChanged} />
