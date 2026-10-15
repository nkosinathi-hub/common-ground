<script lang="ts">
  import { useAuth } from "@/features/auth"
  import { NotificationsBell } from "@/features/notifications"
  import { SettingsPage, useSpaces } from "@/features/spaces"
  import type { Route } from "@/shared/domain"
  import HomePage from "./pages/HomePage.svelte"
  import IdeasSection from "./pages/IdeasSection.svelte"
  import WatchSection from "./pages/WatchSection.svelte"
  import AppShell from "./shell/AppShell.svelte"
  import type { Section } from "./shell/nav"

  type SpaceRoute = Extract<Route, { spaceId: string }>
  let { route, signOut }: { route: SpaceRoute; signOut: () => void } = $props()
  const { store } = useSpaces()
  const { session } = useAuth()

  $effect(() => void store.activate(route.spaceId))
  const space = $derived(store.spaces.find((s) => s.id === route.spaceId)!)
  const section = $derived<Section | null>(
    route.name === "home"
      ? "home"
      : route.name === "watch" || route.name === "watch-item"
        ? "watch"
        : route.name === "ideas" || route.name === "idea"
          ? "ideas"
          : null,
  )
</script>

{#key space.id}
  <AppShell spaceId={space.id} current={section} theme={space.template} onSignOut={signOut}>
    {#snippet actions()}<NotificationsBell />{/snippet}
    {#if route.name === "home"}
      <HomePage {space} />
    {:else if route.name === "watch" || route.name === "watch-item"}
      <WatchSection {space} itemId={route.name === "watch-item" ? route.itemId : null} />
    {:else if route.name === "ideas" || route.name === "idea"}
      <IdeasSection {space} {route} />
    {:else if route.name === "settings"}
      <SettingsPage {space} me={session.user?.id ?? ""} />
    {/if}
  </AppShell>
{/key}
