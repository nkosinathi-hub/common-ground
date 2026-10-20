<script lang="ts">
  import { onMount } from "svelte"
  import { ModeWatcher } from "mode-watcher"
  import { Toaster } from "$lib/components/ui/sonner"
  import { clearDeviceData, ErrorState, Loading } from "@/shared/ui"
  import { boot } from "./boot"
  import { compose, provideServices } from "./composition"
  import Page from "./Page.svelte"
  import { RouteGate } from "./routing/gate.svelte"
  import { Router } from "./routing/router.svelte"

  const services = compose()
  provideServices(services)
  const { session, spacesStore, notifications, auth } = services
  const router = new Router()
  const gate = new RouteGate(router, session, spacesStore)
  let booted = $state(false)
  let linkExpired = $state(false)

  onMount(() => {
    const stopRouter = router.start()
    void boot(services, router).then((result) => {
      linkExpired = result.linkExpired
      booted = true
    })
    return () => {
      stopRouter()
      session.dispose()
    }
  })

  // Keyed on the id only: token refreshes replace the user object but must not reload data.
  const userId = $derived(session.user?.id ?? null)
  $effect(() => {
    if (!userId) return spacesStore.clear()
    void spacesStore.refresh()
    return notifications.start()
  })

  $effect(() => gate.rememberInvite())

  $effect(() => {
    const decision = gate.decision
    if (booted && gate.ready && !gate.failed && decision.kind === "redirect")
      router.go(decision.route, true)
  })

  async function signOut(scope: "here" | "everywhere" = "here") {
    await (scope === "everywhere" ? auth.signOutEverywhere() : auth.signOut())
    clearDeviceData()
    spacesStore.clear()
    router.go({ name: "sign-in" }, true)
  }
</script>

<!-- The CSP forbids inline scripts; mode changes apply synchronously so AppShell reads them. -->
<ModeWatcher disableHeadScriptInjection synchronousModeChanges />
<Toaster richColors position="top-center" />
{#if !booted || !gate.ready}
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
