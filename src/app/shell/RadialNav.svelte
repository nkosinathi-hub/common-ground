<script lang="ts">
  import { type PageActionSpec } from "@/shared/ui"
  import { tick } from "svelte"
  import type { Section } from "./nav"
  import { fanKeys, fanKeyTarget } from "./fan-keys"
  import { fanContains } from "./fan-bounds"
  import FanItems from "./FanItems.svelte"
  import RouteAction from "./RouteAction.svelte"
  let {
    spaceId,
    current,
    routeKey,
    action,
    tools = [],
    requested = $bindable(false),
  }: {
    spaceId: string
    current: Section | null
    routeKey: string
    action: PageActionSpec
    tools?: PageActionSpec[]
    requested?: boolean
  } = $props()
  let root = $state<HTMLElement>(),
    trigger = $state<HTMLButtonElement | null>(null)
  let pinned = $state(false),
    hovered = $state(false)
  const open = $derived(pinned || hovered || requested)
  const id = $props.id()
  let routes = $state(false),
    changing = false
  async function showRoutes() {
    changing = true
    routes = pinned = true
    await tick()
    root?.querySelector<HTMLElement>(".fan-route")?.focus()
    changing = false
  }
  function close(restore = false) {
    if (restore) trigger?.focus()
    requested = pinned = hovered = false
    routes = false
  }
  $effect(() => {
    void routeKey
    close()
  })
  $effect(() => {
    if (requested) void showRoutes()
  })
</script>

<svelte:window
  onpointermove={(event) => {
    if (event.pointerType === "mouse" && open) hovered = fanContains(root, event)
  }}
  onkeydown={(event) => {
    if (fanKeyTarget(event, root, open))
      fanKeys(
        event,
        root,
        open,
        () => (pinned = true),
        () => close(true),
      )
  }}
  onpointerdown={(event) => {
    if (event.target instanceof Node && !root?.contains(event.target)) close()
  }}
/>
<nav
  bind:this={root}
  aria-label="Main"
  class="radial-nav"
  data-open={open}
  onfocusout={(event) => {
    if (
      !changing &&
      (!(event.relatedTarget instanceof Node) || !root?.contains(event.relatedTarget))
    )
      close()
  }}
>
  <div {id} class="route-fan" inert={!open} aria-hidden={!open}>
    <FanItems {spaceId} {current} {tools} {routes} onNavigate={showRoutes} onClose={close} />
  </div>
  <RouteAction
    {action}
    {open}
    controls={id}
    bind:trigger
    onReveal={() => (pinned = true)}
    onHover={() => (hovered = true)}
    onActivate={() => close()}
    onHold={showRoutes}
  />
</nav>
