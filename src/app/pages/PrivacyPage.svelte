<script lang="ts">
  import { ArrowUpRight } from "@lucide/svelte"
  import { buildHash, type PrivacyPart } from "@/shared/domain"
  import { ContentsNav, TextLink } from "@/shared/ui"
  import { NOTICE } from "./privacy/notice"

  interface Props {
    /** Inside the app shell, which owns the page's main landmark. */
    framed?: boolean
    /** Which half of the notice is on screen; the first when absent. */
    part?: PrivacyPart
  }

  let { framed = false, part = "store" }: Props = $props()
  const sections = $derived(NOTICE.filter((section) => section.part === part))
  const items = NOTICE.map((s) => ({
    id: s.id,
    label: s.title,
    href: buildHash({ name: "privacy", part: s.part }),
  }))
</script>

<!-- Figma D20a and D20b: the notice in plain language, its contents on the left. -->
<svelte:element
  this={framed ? "div" : "main"}
  class="flex flex-col gap-section {framed ? '' : 'mx-auto max-w-content px-gutter py-section'}"
>
  <hgroup class="flex flex-col gap-related">
    <p class="type-overline text-muted-foreground uppercase">POPIA notice</p>
    <h1 class="type-h1 text-foreground">Privacy, in plain language</h1>
  </hgroup>
  <div class="grid gap-section md:grid-cols-[13rem_minmax(0,1fr)]">
    <aside class="flex flex-col gap-stack md:sticky md:top-24 md:self-start">
      <p class="type-overline text-muted-foreground uppercase">On this page</p>
      <ContentsNav {items} current={sections[0]!.id} label="Privacy notice" />
      <TextLink href={buildHash({ name: "account", tab: "data" })} icon={ArrowUpRight}
        >Account and data</TextLink
      >
    </aside>
    <article class="flex max-w-(--measure-prose) flex-col gap-section">
      {#if part === "store"}
        <p class="type-h3 font-normal text-foreground">
          Common Ground is a private space for you and the people you invite. This notice explains
          what we keep, in line with South Africa's Protection of Personal Information Act (POPIA).
        </p>
      {/if}
      {#each sections as section (section.id)}
        <section class="flex flex-col gap-item" aria-labelledby="privacy-{section.id}">
          <h2 id="privacy-{section.id}" class="type-h2 text-foreground">{section.title}</h2>
          {#each section.paragraphs as paragraph (paragraph)}
            <p class="type-body text-foreground">{paragraph}</p>
          {/each}
        </section>
      {/each}
    </article>
  </div>
</svelte:element>
