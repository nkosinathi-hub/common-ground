<script lang="ts">
  import { AppearanceCard } from "@/features/account"
  import type { Space } from "../domain/space"
  import DangerZone from "./DangerZone.svelte"
  import InvitesCard from "./InvitesCard.svelte"
  import MembersCard from "./MembersCard.svelte"
  import GeneralCard from "./settings/GeneralCard.svelte"
  import HomeLayoutCard from "./settings/HomeLayoutCard.svelte"
  import LookCard from "./settings/LookCard.svelte"
  import MediaCard from "./settings/MediaCard.svelte"
  import PreferencesCard from "./settings/PreferencesCard.svelte"
  import SectionNav from "./settings/SectionNav.svelte"

  interface Props {
    space: Space
    /** The signed-in user's id, so their own row is marked and cannot be removed. */
    me: string
  }

  let { space, me }: Props = $props()
  const owner = $derived(space.role === "owner")
  const OWNER_SECTIONS = [
    { id: "settings-general", label: "Name and feel" },
    { id: "settings-look", label: "Look" },
    { id: "settings-pictures", label: "Pictures" },
    { id: "settings-home", label: "Home layout" },
    { id: "settings-preferences", label: "Preferences" },
  ]
  const sections = $derived([
    ...(owner ? OWNER_SECTIONS : []),
    { id: "settings-appearance", label: "Appearance" },
    ...(owner ? [{ id: "settings-invites", label: "Invites" }] : []),
    { id: "settings-members", label: "Members" },
    { id: "settings-danger", label: owner ? "Danger zone" : "Leave" },
  ])
</script>

<div class="grid gap-6">
  <h1 class="text-2xl font-semibold">Space settings</h1>
  <div class="grid gap-6 md:grid-cols-[11rem_1fr]">
    <SectionNav {sections} />
    <div class="grid min-w-0 gap-6">
      {#if owner}
        <GeneralCard {space} />
        <LookCard {space} />
        <MediaCard {space} />
        <HomeLayoutCard {space} />
        <PreferencesCard {space} />
      {/if}
      <div id="settings-appearance" tabindex="-1"><AppearanceCard /></div>
      {#if owner}<div id="settings-invites" tabindex="-1"><InvitesCard {space} /></div>{/if}
      <div id="settings-members" tabindex="-1"><MembersCard {space} {me} /></div>
      <div id="settings-danger" tabindex="-1"><DangerZone {space} /></div>
    </div>
  </div>
</div>
