<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { SelectField } from "@/shared/ui"
  import type { Member } from "../../domain/space"

  interface Props {
    /** Everyone but the owner. */
    others: readonly Member[]
    onReview: (member: Member) => void
  }

  let { others, onReview }: Props = $props()
  let chosen = $state("")
  const options = $derived([
    { value: "", label: "Choose a member" },
    ...others.map((m) => ({ value: m.userId, label: m.displayName })),
  ])
  const member = $derived(others.find((m) => m.userId === chosen))
</script>

<!-- D17 Transfer ownership: pick the new owner, then confirm in a dialog. -->
<SelectField
  id="new-owner"
  label="New owner"
  value={chosen}
  {options}
  onchange={(value) => (chosen = value)}
/>
<div class="flex justify-end border-t border-border pt-stack">
  <Button variant="outline" disabled={!member} onclick={() => member && onReview(member)}
    >Review transfer</Button
  >
</div>
