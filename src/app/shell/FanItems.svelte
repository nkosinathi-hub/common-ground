<script lang="ts">
  import { Compass } from "@lucide/svelte"
  import type { PageActionSpec } from "@/shared/ui"
  import { SECTIONS, sectionHref, type Section } from "./nav"
  import { FAN_POSITIONS } from "./fan-keys"
  let {
    spaceId,
    current,
    tools,
    routes,
    onNavigate,
    onClose,
  }: {
    spaceId: string
    current: Section | null
    tools: PageActionSpec[]
    routes: boolean
    onNavigate: () => void
    onClose: (restore?: boolean) => void
  } = $props()
  const slots = $derived(
    tools.length === 2 ? [0, 2, 4] : tools.length === 3 ? [0, 1, 3, 4] : [0, 1, 2, 3, 4],
  )
  const position = (i: number) =>
    `--x:${FAN_POSITIONS[i]![0]};--y:${FAN_POSITIONS[i]![1]};--step:${i}`
</script>

{#if tools.length && !routes}
  {#each tools.slice(0, 4) as tool, i (tool)}
    <button
      type="button"
      class="fan-route"
      style={position(slots[i]!)}
      aria-label={tool.label}
      disabled={tool.disabled}
      onclick={() => {
        onClose(true)
        tool.onclick()
      }}
    >
      <tool.icon class="size-5" aria-hidden="true" />
      <span class="fan-label">{tool.label}</span>
    </button>
  {/each}
  <button
    type="button"
    class="fan-route"
    style={position(4)}
    aria-label="Navigate"
    onclick={onNavigate}
  >
    <Compass class="size-5" aria-hidden="true" /><span class="fan-label">Navigate</span>
  </button>
{:else}
  {#each SECTIONS as section, i (section.id)}
    <a
      href={sectionHref(spaceId, section.id)}
      aria-label={section.label}
      aria-current={current === section.id ? "page" : undefined}
      class="fan-route"
      style={position(i)}
      onclick={() => onClose()}
    >
      <section.icon class="size-5" aria-hidden="true" />
      <span class="fan-label">{section.label}</span>
    </a>
  {/each}
{/if}
