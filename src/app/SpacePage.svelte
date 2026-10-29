<script lang="ts">
  import { useAuth } from "@/features/auth"
  import { NotificationsBell } from "@/features/notifications"
  import { SettingsPage, useSpaces } from "@/features/spaces"
  import type { Route } from "@/shared/domain"
  import { Loading } from "@/shared/ui"
  import HomePage from "./pages/HomePage.svelte"
  import NotesPage from "./pages/NotesPage.svelte"
  import CalendarSection from "./pages/CalendarSection.svelte"
  import IdeasSection from "./pages/IdeasSection.svelte"
  import PartySection from "./pages/PartySection.svelte"
  import WatchSection from "./pages/WatchSection.svelte"
  import AppShell from "./shell/AppShell.svelte"
  import QuickCapture from "./shell/QuickCapture.svelte"

  type SpaceRoute = Extract<Route, { spaceId: string }>
  interface Props {
    route: SpaceRoute
    signOut: () => void
  }

  let { route, signOut }: Props = $props()
  const { store } = useSpaces()
  const { session } = useAuth()

  $effect(() => void store.activate(route.spaceId))
  // The gate admits only member spaces, but after leaving or deleting one the store refreshes
  // before the route moves on: show Loading for that moment instead of asserting it exists.
  const space = $derived(store.spaces.find((s) => s.id === route.spaceId))
  const user = $derived(session.user)
</script>

{#if space && user}
  {#key space.id}
    <AppShell {space} {route} onSignOut={signOut}>
      {#snippet actions()}<QuickCapture spaceId={space.id} /><NotificationsBell />{/snippet}
      {#snippet bell()}<QuickCapture spaceId={space.id} compact /><NotificationsBell />{/snippet}
      {#if route.name === "home"}
        <HomePage {space} displayName={user.displayName} />
      {:else if route.name === "notes" || route.name === "note"}
        <NotesPage spaceId={space.id} />
      {:else if route.name === "watch" || route.name === "watch-item"}
        <WatchSection
          {space}
          me={user.id}
          itemId={route.name === "watch-item" ? route.itemId : null}
        />
      {:else if route.name === "ideas" || route.name === "idea"}
        <IdeasSection
          {space}
          me={user.id}
          ideaId={route.name === "idea" ? route.ideaId : null}
          tab={route.name === "idea" ? route.tab : "overview"}
        />
      {:else if route.name === "calendar" || route.name === "event"}
        <CalendarSection
          {space}
          me={user.id}
          eventId={route.name === "event" ? route.eventId : null}
        />
      {:else if route.name === "party"}
        <PartySection spaceId={space.id} partyId={route.partyId} me={user.id} />
      {:else if route.name === "settings"}
        <SettingsPage {space} me={user.id} tab={route.tab} />
      {/if}
    </AppShell>
  {/key}
{:else}
  <Loading />
{/if}
