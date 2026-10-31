<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { SelectField } from "@/shared/ui"
  import type { Member } from "../../domain/space"

  interface Props {
    /** Members who are not owners yet. */
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

<!-- D17 owners: pick a member to make an owner too, then confirm in a dialog. -->
<SelectField
  id="new-owner"
  label="Member"
  value={chosen}
  {options}
  onchange={(value) => (chosen = value)}
/>
<div class="flex justify-end border-t border-border pt-stack">
  <Button variant="outline" disabled={!member} onclick={() => member && onReview(member)}
    >Make owner</Button
  >
</div>
