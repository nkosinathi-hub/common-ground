<script lang="ts">
  import { AppearanceCard } from "@/features/account"
  import * as Tabs from "$lib/components/ui/tabs"
  import type { SettingsTab } from "@/shared/domain"
  import { navigate } from "@/shared/ui"
  import { SETTINGS_TAB_LABELS, settingsTabOf, settingsTabsFor } from "../domain/settings-tabs"
  import type { Space } from "../domain/space"
  import DangerZone from "./DangerZone.svelte"
  import InvitesCard from "./InvitesCard.svelte"
  import LookSettings from "./look/LookSettings.svelte"
  import MembersCard from "./MembersCard.svelte"
  import GeneralCard from "./settings/GeneralCard.svelte"
  import HomeLayoutCard from "./settings/HomeLayoutCard.svelte"
  import MediaCard from "./settings/MediaCard.svelte"
  import PreferencesCard from "./settings/PreferencesCard.svelte"

  interface Props {
    space: Space
    /** The signed-in user's id, so their own row is marked and cannot be removed. */
    me: string
    /** From the link; a bare /settings opens the viewer's first tab. */
    tab?: SettingsTab
  }

  let { space, me, tab }: Props = $props()
  const owner = $derived(space.role === "owner")
  const tabs = $derived(settingsTabsFor(space.role))
  const current = $derived(settingsTabOf(space.role, tab))
  const open = (next: string) =>
    navigate({ name: "settings", spaceId: space.id, tab: next as SettingsTab })
</script>

<!-- D15a to D17: the page header, then four underline tabs, each a link of its own. -->
<div class="flex flex-col gap-section">
  <div class="flex flex-col gap-related">
    <h1 class="type-h1">Space settings</h1>
    <p class="type-sm text-muted-foreground">
      Make {space.name} feel like yours, without losing your way.
    </p>
  </div>
  <Tabs.Root value={current} onValueChange={open} class="flex flex-col gap-section">
    <Tabs.List variant="line" aria-label="Settings" class="w-full justify-start overflow-x-auto">
      {#each tabs as id (id)}<Tabs.Trigger value={id}>{SETTINGS_TAB_LABELS[id]}</Tabs.Trigger
        >{/each}
    </Tabs.List>
    {#if owner}
      <Tabs.Content value="identity" class="flex flex-col gap-section">
        <GeneralCard {space} /><MediaCard {space} />
      </Tabs.Content>
      <Tabs.Content value="look"><LookSettings {space} /></Tabs.Content>
    {/if}
    <Tabs.Content value="home" class="flex flex-col gap-section">
      {#if owner}<HomeLayoutCard {space} /><PreferencesCard {space} />{/if}
      <AppearanceCard />
    </Tabs.Content>
    <Tabs.Content value="members" class="flex flex-col gap-section">
      {#if owner}<InvitesCard {space} />{/if}
      <MembersCard {space} {me} />
      <DangerZone {space} />
    </Tabs.Content>
  </Tabs.Root>
</div>
