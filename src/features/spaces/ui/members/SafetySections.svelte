<script lang="ts">
  import { ConfirmDialog, SettingsSection } from "@/shared/ui"
  import type { Member, Space } from "../../domain/space"
  import DangerRow from "./DangerRow.svelte"
  import DeleteSpaceDialog from "./DeleteSpaceDialog.svelte"
  import type { MembersState } from "./members-state.svelte"
  import OwnerCard from "./OwnerCard.svelte"

  interface Props {
    space: Space
    people: MembersState
    /** Everyone but the viewer. */
    others: readonly Member[]
  }

  let { space, people, others }: Props = $props()
  const candidates = $derived(others.filter((m) => m.role === "member"))
  // An owner can leave only while another owner keeps the space.
  const coOwned = $derived(others.some((m) => m.role === "owner"))
  let deleting = $state(false)
  let leaving = $state(false)
</script>

<!-- D17: owners add owners, leave while another owner remains, or delete; D17b: a member leaves. -->
{#if space.role === "owner"}
  {#if candidates.length}
    <SettingsSection
      title="Owners"
      description="Owners manage members, invitations and settings. A space can have more than one."
    >
      <OwnerCard others={candidates} onReview={(member) => people.ask(member, "makeOwner")} />
    </SettingsSection>
  {/if}
  <SettingsSection title="Danger zone" description="These actions cannot be undone." danger>
    {#if others.length === 1}
      <DangerRow
        title="Remove a member"
        description="{others[0]!
          .displayName} loses access immediately. What they shared stays in the space."
        action="Remove member…"
        onclick={() => people.ask(others[0]!, "remove")}
      />
    {/if}
    {#if coOwned}
      <DangerRow
        title="Leave {space.name}"
        description="Another owner keeps the space. What you shared stays."
        action="Leave space…"
        onclick={() => (leaving = true)}
      />
    {/if}
    <DangerRow
      title="Delete this space"
      description="Permanently removes notes, titles, ideas, tasks, budget and files for everyone. You will type the space name to confirm."
      action="Delete space…"
      solid
      onclick={() => (deleting = true)}
    />
  </SettingsSection>
  <DeleteSpaceDialog bind:open={deleting} {space} />
{:else}
  <SettingsSection
    title="Leave space"
    description="To come back, you need a new invitation."
    danger
  >
    <DangerRow
      title="Leave {space.name}"
      description="You lose access straight away. What you shared stays in the space."
      action="Leave space…"
      onclick={() => (leaving = true)}
    />
  </SettingsSection>
{/if}
<ConfirmDialog
  bind:open={leaving}
  title="Leave {space.name}?"
  description="You lose access right away. You can rejoin only with a new invitation."
  confirmLabel="Leave"
  onConfirm={people.leave}
/>
