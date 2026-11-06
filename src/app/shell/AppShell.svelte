<script lang="ts">
  import { Lightbulb } from "@lucide/svelte"
  import { openCapture } from "@/features/ideas"
  import type { Snippet } from "svelte"
  import { mode } from "mode-watcher"
  import { applySpaceLook, useSpaces, type Space } from "@/features/spaces"
  import { buildHash, type Route } from "@/shared/domain"
  import { pageTitle, providePageActions, provideSearchControl } from "@/shared/ui"
  import { crumbsOf } from "./breadcrumbs"
  import AdaptiveNav from "./AdaptiveNav.svelte"
  import { sectionOf } from "./nav"
  import TopBar from "./TopBar.svelte"

  interface Props {
    space: Space
    route: Route
    onSignOut: () => void
    children: Snippet
  }

  let { space, route, onSignOut, children }: Props = $props()
  const actions = providePageActions()
  provideSearchControl()

  const current = $derived(sectionOf(route.name))
  const crumbs = $derived(crumbsOf(route, space.name, pageTitle.current))
  // The look applies only inside the shell; leaving it restores the neutral palette.
  const colourMode = $derived(mode.current === "dark" ? "dark" : "light")
  const { store } = useSpaces()
  const backgroundUrl = $derived(store.mediaUrl(space.backgroundPath))
  $effect(() => applySpaceLook(document.documentElement, space.look, colourMode, backgroundUrl))
  /** The router reads every hash as a route, so the skip link moves focus itself. */
  function skipToMain(event: MouseEvent) {
    event.preventDefault()
    document.getElementById("main")?.focus()
  }
</script>

<a
  href="#main"
  onclick={skipToMain}
  class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-background focus:p-2"
>
  Skip to content
</a>
<div class="flex min-h-dvh min-w-0 flex-col">
  <AdaptiveNav
    {space}
    routeKey={buildHash(route)}
    {current}
    {onSignOut}
    tools={actions.tools}
    action={actions.current ?? {
      label: "Capture an idea from anywhere",
      icon: Lightbulb,
      onclick: openCapture,
    }}
  />
  <main
    id="main"
    tabindex="-1"
    class="mx-auto flex w-full max-w-content flex-1 flex-col gap-stack px-gutter pt-stack pb-36 outline-none"
  >
    <TopBar {crumbs} />
    {@render children()}
  </main>
</div>
