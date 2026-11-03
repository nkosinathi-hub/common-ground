<script lang="ts">
  import type { PageActionSpec } from "@/shared/ui"
  import type { Space } from "@/features/spaces"
  import UniversalSearch from "../search/UniversalSearch.svelte"
  import type { Section } from "./nav"
  import RadialNav from "./RadialNav.svelte"
  import AppMenu from "./AppMenu.svelte"

  interface Props {
    space: Space
    routeKey: string
    current: Section | null
    onSignOut: () => void
    action: PageActionSpec
  }
  let { space, routeKey, current, onSignOut, action }: Props = $props()
  let searching = $state(false),
    navigationOpen = $state(false)
</script>

<!-- The wrapper is invisible: each control floats on its own surface. -->
<header class="sticky top-(--chrome-top) z-30 py-related">
  <div class="mx-auto w-full max-w-content px-gutter py-related">
    <div class="header-row" data-searching={searching}>
      <div class="header-utility" inert={searching}>
        <AppMenu
          spaceId={space.id}
          {routeKey}
          {onSignOut}
          onNavigate={() => (navigationOpen = true)}
        />
      </div>
      <UniversalSearch {space} bind:expanded={searching} />
    </div>
  </div>
</header>

<RadialNav spaceId={space.id} {current} {routeKey} {action} bind:requested={navigationOpen} />
