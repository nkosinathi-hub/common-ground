<script lang="ts">
  import { Capacitor } from "@capacitor/core"
  import { onMount } from "svelte"
  import { ModeWatcher } from "mode-watcher"
  import { Toaster } from "$lib/components/ui/sonner"
  import { clearDeviceData, ErrorState, Loading } from "@/shared/ui"
  import { boot } from "./boot"
  import { compose, provideServices } from "./composition"
  import Page from "./Page.svelte"
  import { RouteGate } from "./routing/gate.svelte"
  import { PushSession } from "./native/push-session"
  import { Router } from "./routing/router.svelte"
  import DemoNotice from "./demo/DemoNotice.svelte"
  import DemoPage from "./pages/DemoPage.svelte"
  import { composeDemo } from "./demo/services"
  const demo = new URLSearchParams(location.search).get("demo") === "1"
  const services = demo ? composeDemo() : compose()
  provideServices(services)
  const { session, spacesStore, notifications, auth } = services
  const router = new Router()
  const gate = new RouteGate(router, session, spacesStore)
  let booted = $state(false),
    linkExpired = $state(false)
  let bootStarted = false
  onMount(() => {
    const stopRouter = router.start()
    return () => {
      stopRouter()
      session.dispose()
    }
  })
  $effect(() => {
    if (router.route.name === "demo" || bootStarted) return
    bootStarted = true
    void boot(services, router).then((result) => {
      linkExpired = result.linkExpired
      booted = true
    })
  })
  const userId = $derived(session.user?.id ?? null)
  $effect(() => {
    if (!userId) return spacesStore.clear()
    void spacesStore.refresh()
    if (!demo) void services.simkl.syncOnOpen(userId) // once per app open, never on a timer
    return notifications.start()
  })
  const phonePush =
    !demo && Capacitor.isNativePlatform() && import.meta.env.VITE_PUSH === "on"
      ? new PushSession(() =>
          import("./native/push").then((m) => m.startPush(services.pushDevices)),
        )
      : null
  $effect(() => void phonePush?.follow(userId))

  $effect(() => gate.rememberInvite())

  $effect(() => {
    const decision = gate.decision
    if (
      router.route.name !== "demo" &&
      booted &&
      gate.ready &&
      !gate.failed &&
      decision.kind === "redirect"
    )
      router.go(decision.route, true)
  })

  async function signOut(scope: "here" | "everywhere" = "here") {
    if (demo) return location.reload() // reset the sample without touching a real session
    await phonePush?.follow(null) // while the session still exists, so the server forgets too
    await (scope === "everywhere" ? auth.signOutEverywhere() : auth.signOut())
    await services.playback.jellyfin?.signOut() // revokes the Jellyfin session, forgets the token
    clearDeviceData()
    spacesStore.clear()
    router.go({ name: "sign-in" }, true)
  }
</script>

<!-- The CSP forbids inline scripts; mode changes apply synchronously so AppShell reads them. -->
<ModeWatcher disableHeadScriptInjection synchronousModeChanges />
<Toaster richColors position="top-center" />
{#if demo}<DemoNotice />{/if}
{#if router.route.name === "demo"}
  <DemoPage />
{:else if !booted || !gate.ready}
  <div class="mx-auto max-w-md p-8"><Loading label="Opening Common Ground" /></div>
{:else if gate.failed && spacesStore.error}
  <div class="mx-auto max-w-md p-8">
    <ErrorState error={spacesStore.error} onRetry={() => void spacesStore.refresh()} />
  </div>
{:else if gate.decision.kind === "render"}
  <Page
    route={gate.decision.route}
    {linkExpired}
    signOut={() => signOut()}
    signOutEverywhere={() => signOut("everywhere")}
    onPasswordSaved={() => router.go({ name: "entry" }, true)}
  />
{/if}
