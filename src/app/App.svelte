<script lang="ts">
  import { onMount } from "svelte"
  import { Toaster } from "$lib/components/ui/sonner"
  import { Loading } from "@/shared/ui"
  import { handleAuthCallback } from "./callback"
  import { compose, provideServices } from "./composition"
  import Page from "./Page.svelte"
  import { pendingInvite } from "./routing/pending-invite"
  import { resolveRoute } from "./routing/resolve"
  import { Router } from "./routing/router.svelte"

  const services = compose()
  provideServices(services)
  const router = new Router()
  const { session, spacesStore } = services
  let booted = $state(false)
  let linkExpired = $state(false)

  onMount(() => {
    const stop = router.start()
    void (async () => {
      const outcome = await handleAuthCallback(services.auth)
      linkExpired = outcome === "expired"
      if (outcome === "new-password") router.go({ name: "new-password" }, true)
      await session.start()
      booted = true
    })()
    return () => {
      stop()
      session.dispose()
    }
  })

  $effect(() => {
    if (session.user) void spacesStore.refresh()
    else spacesStore.clear()
  })

  const spacesReady = $derived(
    !session.user || spacesStore.status === "ready" || spacesStore.status === "error",
  )
  const decision = $derived(
    resolveRoute(router.route, {
      signedIn: Boolean(session.user),
      spaceIds: spacesStore.spaces.map((s) => s.id),
      activeSpaceId: spacesStore.active?.id ?? null,
      pendingInvite: router.route.name === "invite" ? null : pendingInvite.read(),
    }),
  )

  $effect(() => {
    if (router.route.name === "invite" && !session.user) pendingInvite.write(router.route.token)
    if (router.route.name === "invite" && session.user) pendingInvite.write(null)
  })

  $effect(() => {
    if (booted && spacesReady && decision.kind === "redirect") router.go(decision.route, true)
  })

  async function signOut() {
    await services.auth.signOut()
    spacesStore.clear()
    router.go({ name: "sign-in" }, true)
  }
</script>

<Toaster richColors position="top-center" />
{#if !booted || !spacesReady}
  <div class="mx-auto max-w-md p-8"><Loading label="Opening Common Ground" /></div>
{:else if decision.kind === "render"}
  <Page
    route={decision.route}
    {linkExpired}
    {signOut}
    onPasswordSaved={() => router.go({ name: "entry" }, true)}
  />
{/if}
