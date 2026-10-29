<script lang="ts">
  import { untrack } from "svelte"
  import { AsyncView, ConfirmDialog, SettingsSection } from "@/shared/ui"
  import type { Space } from "../../domain/space"
  import { useSpaces } from "../context"
  import { MEMBER_ACTIONS } from "../member-actions"
  import InvitationsCard from "./InvitationsCard.svelte"
  import MemberRows from "./MemberRows.svelte"
  import { MembersState } from "./members-state.svelte"
  import SafetySections from "./SafetySections.svelte"

  let { space, me }: { space: Space; me: string } = $props()
  const { service, store } = useSpaces()
  const state = new MembersState(service, store, () => space)
  $effect(() => void untrack(() => state.load()))
  const owner = $derived(space.role === "owner")
  const others = $derived((state.members.value ?? []).filter((m) => m.userId !== me))
  const copy = $derived(state.pending ? MEMBER_ACTIONS[state.pending.action] : null)
</script>

<!-- Figma D17 (owner) and D17b (member): members, invitations, then transfer and danger. -->
<SettingsSection
  title="Members"
  description={owner
    ? "Only current members can see this space. Removing someone takes effect immediately."
    : "Only current members can see this space."}
>
  <AsyncView resource={state.members}>
    {#snippet children(list)}
      <MemberRows members={list} {me} manage={owner} onAction={state.ask} />
    {/snippet}
  </AsyncView>
</SettingsSection>
<SettingsSection
  title="Invitations"
  description="Each link works once and expires after seven days. Share it directly; creating a link does not send an email."
>
  <InvitationsCard
    invites={state.invites.value ?? []}
    members={state.members.value ?? []}
    {me}
    {owner}
    onCreate={state.create}
    onRevoke={state.revoke}
  />
</SettingsSection>
<SafetySections {space} people={state} {others} />
{#if state.pending && copy}
  <ConfirmDialog
    bind:open={state.asking}
    title={copy.title(state.pending.member.displayName)}
    description={copy.description}
    confirmLabel={copy.confirmLabel}
    destructive={copy.destructive}
    onConfirm={state.confirm}
  />
{/if}
