<script lang="ts">
  import { Settings } from "@lucide/svelte"
  import { buildHash } from "@/shared/domain"
  import { Logo } from "@/shared/ui"
  import AccountMenu from "./AccountMenu.svelte"
  import { SECTIONS, sectionHref, type Section } from "./nav"
  import NavItem from "./NavItem.svelte"
  import SpaceSwitcher from "./SpaceSwitcher.svelte"

  interface Props {
    spaceId: string
    current: Section | null
    onSignOut: () => void
  }

  let { spaceId, current, onSignOut }: Props = $props()
</script>

<!-- Figma Rail / Desktop (208:3788): 224 wide, filled with the space's button colour. -->
<aside
  class="sticky top-(--chrome-top) hidden h-[calc(100dvh-var(--chrome-top))] w-56 shrink-0 flex-col gap-section bg-sidebar px-inset py-card text-sidebar-foreground md:flex"
>
  <div class="flex items-center gap-related">
    <Logo size={32} />
    <span class="type-label">Common Ground</span>
  </div>
  <div class="flex flex-col gap-section">
    <SpaceSwitcher variant="rail" />
    <nav aria-label="Main" class="flex flex-col gap-hairline">
      {#each SECTIONS as section (section.id)}
        <NavItem
          href={sectionHref(spaceId, section.id)}
          label={section.label}
          icon={section.icon}
          active={current === section.id}
        />
      {/each}
    </nav>
  </div>
  <div class="mt-auto flex flex-col gap-hairline">
    <NavItem
      href={buildHash({ name: "settings", spaceId })}
      label="Space settings"
      icon={Settings}
      active={current === "settings"}
    />
    <hr class="my-hairline border-sidebar-foreground/16" />
    <AccountMenu variant="rail" active={current === "account"} {onSignOut} />
  </div>
</aside>
