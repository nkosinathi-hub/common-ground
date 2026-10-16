<script lang="ts">
  export interface SettingsSection {
    readonly id: string
    readonly label: string
  }

  interface Props {
    sections: readonly SettingsSection[]
  }

  let { sections }: Props = $props()

  /** The router reads every hash as a route, so section links scroll and focus by hand. */
  function go(id: string) {
    const target = document.getElementById(id)
    target?.scrollIntoView({ block: "start" })
    target?.focus({ preventScroll: true })
  }
</script>

<nav
  aria-label="Settings sections"
  class="-mx-4 overflow-x-auto px-4 md:sticky md:top-4 md:mx-0 md:self-start md:px-0"
>
  <ul class="flex gap-2 md:flex-col md:gap-1">
    {#each sections as section (section.id)}
      <li>
        <button
          type="button"
          onclick={() => go(section.id)}
          class="rounded-full border px-3 py-1 text-sm whitespace-nowrap hover:bg-accent md:w-full md:rounded-md md:border-none md:text-left"
        >
          {section.label}
        </button>
      </li>
    {/each}
  </ul>
</nav>
