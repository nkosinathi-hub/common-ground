<script lang="ts">
  import type { Snippet } from "svelte"
  import { mode } from "mode-watcher"
  import { applySpaceLook, type Space } from "@/features/spaces"
  import type { Route } from "@/shared/domain"
  import { pageTitle } from "@/shared/ui"
  import { crumbsOf } from "./breadcrumbs"
  import MobileBars from "./MobileBars.svelte"
  import { sectionOf } from "./nav"
  import Rail from "./Rail.svelte"
  import TopBar from "./TopBar.svelte"

  interface Props {
    space: Space
    route: Route
    onSignOut: () => void
    /** Desktop top bar actions: Capture idea and the bell. */
    actions?: Snippet
    /** The bell for the mobile app bar. */
    bell?: Snippet
    children: Snippet
  }

  let { space, route, onSignOut, actions, bell, children }: Props = $props()

  const current = $derived(sectionOf(route.name))
  const crumbs = $derived(crumbsOf(route, space.name, pageTitle.current))
  // The look applies only inside the shell; leaving it restores the neutral palette.
  const colourMode = $derived(mode.current === "dark" ? "dark" : "light")
  $effect(() => applySpaceLook(document.documentElement, space, colourMode))
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
<div class="flex min-h-dvh">
  <Rail spaceId={space.id} {current} {onSignOut} />
  <div class="flex min-w-0 flex-1 flex-col">
    <TopBar {crumbs} {actions} />
    <MobileBars spaceId={space.id} {current} {onSignOut} {bell}>
      <!-- Phones keep clear of the tab bar and a screen's FAB above it. -->
      <main
        id="main"
        tabindex="-1"
        class="mx-auto w-full max-w-content flex-1 px-gutter pt-section pb-40 outline-none md:pb-section"
      >
        {@render children()}
      </main>
    </MobileBars>
  </div>
</div>
