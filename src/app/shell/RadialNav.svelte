<script lang="ts">
  import { type PageActionSpec } from "@/shared/ui"
  import { SECTIONS, sectionHref, type Section } from "./nav"
  import { fanKeys, FAN_POSITIONS } from "./fan-keys"
  import RouteAction from "./RouteAction.svelte"
  let {
    spaceId,
    current,
    routeKey,
    action,
    requested = $bindable(false),
  }: {
    spaceId: string
    current: Section | null
    routeKey: string
    action: PageActionSpec
    requested?: boolean
  } = $props()
  let root = $state<HTMLElement>(),
    trigger = $state<HTMLButtonElement | null>(null)
  let pinned = $state(false),
    hovered = $state(false)
  const open = $derived(pinned || hovered || requested)
  const id = $props.id()
  function close(restore = false) {
    if (restore) trigger?.focus()
    requested = pinned = hovered = false
  }
  $effect(() => {
    void routeKey
    close()
  })
  $effect(() => {
    if (requested)
      requestAnimationFrame(() => root?.querySelector<HTMLAnchorElement>(".fan-route")?.focus())
  })
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.target instanceof Node && root?.contains(event.target))
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
  onpointerleave={() => (hovered = false)}
  onfocusout={(event) => {
    if (!(event.relatedTarget instanceof Node) || !root?.contains(event.relatedTarget)) close()
  }}
>
  <div {id} class="route-fan" inert={!open} aria-hidden={!open}>
    {#each SECTIONS as section, i (section.id)}
      <a
        href={sectionHref(spaceId, section.id)}
        aria-label={section.label}
        aria-current={current === section.id ? "page" : undefined}
        class="fan-route"
        style={`--x:${FAN_POSITIONS[i]![0]};--y:${FAN_POSITIONS[i]![1]};--step:${i}`}
        onclick={() => close()}
      >
        <section.icon class="size-5" aria-hidden="true" /><span class="fan-label"
          >{section.label}</span
        >
      </a>
    {/each}
  </div>
  <RouteAction
    {action}
    {open}
    controls={id}
    bind:trigger
    onReveal={() => (pinned = true)}
    onHover={() => (hovered = true)}
    onActivate={() => close()}
  />
</nav>
