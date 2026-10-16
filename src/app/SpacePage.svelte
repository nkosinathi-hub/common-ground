<script lang="ts">
  import { useAuth } from "@/features/auth"
  import { NotificationsBell } from "@/features/notifications"
  import { SettingsPage, useSpaces } from "@/features/spaces"
  import type { Route } from "@/shared/domain"
  import HomePage from "./pages/HomePage.svelte"
  import CalendarSection from "./pages/CalendarSection.svelte"
  import IdeasSection from "./pages/IdeasSection.svelte"
  import WatchSection from "./pages/WatchSection.svelte"
  import AppShell from "./shell/AppShell.svelte"
  import QuickCapture from "./shell/QuickCapture.svelte"
  import { sectionOf } from "./shell/nav"

  type SpaceRoute = Extract<Route, { spaceId: string }>
  interface Props {
    route: SpaceRoute
    signOut: () => void
  }

  let { route, signOut }: Props = $props()
  const { store } = useSpaces()
  const { session } = useAuth()

  $effect(() => void store.activate(route.spaceId))
  const space = $derived(store.spaces.find((s) => s.id === route.spaceId)!)
  const section = $derived(sectionOf(route.name))
</script>

{#key space.id}
  <AppShell {space} current={section} onSignOut={signOut}>
    {#snippet actions()}<QuickCapture spaceId={space.id} /><NotificationsBell />{/snippet}
    {#if route.name === "home"}
      <HomePage {space} />
    {:else if route.name === "watch" || route.name === "watch-item"}
      <WatchSection {space} itemId={route.name === "watch-item" ? route.itemId : null} />
    {:else if route.name === "ideas" || route.name === "idea"}
      <IdeasSection
        {space}
        ideaId={route.name === "idea" ? route.ideaId : null}
        tab={route.name === "idea" ? route.tab : "overview"}
      />
    {:else if route.name === "calendar" || route.name === "event"}
      <CalendarSection {space} eventId={route.name === "event" ? route.eventId : null} />
    {:else if route.name === "settings"}
      <SettingsPage {space} me={session.user?.id ?? ""} />
    {/if}
  </AppShell>
{/key}
