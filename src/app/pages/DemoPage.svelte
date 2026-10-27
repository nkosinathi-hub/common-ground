<script lang="ts">
  import { ArrowLeft } from "@lucide/svelte"
  import DemoCalendar from "./DemoCalendar.svelte"
  import DemoDialog from "./DemoDialog.svelte"
  import DemoHeading from "./DemoHeading.svelte"
  import DemoHome from "./DemoHome.svelte"
  import DemoIdeas from "./DemoIdeas.svelte"
  import DemoMobileNav from "./DemoMobileNav.svelte"
  import DemoNotes from "./DemoNotes.svelte"
  import DemoSettings from "./DemoSettings.svelte"
  import DemoSideNav from "./DemoSideNav.svelte"
  import DemoTopBar from "./DemoTopBar.svelte"
  import DemoWatch from "./DemoWatch.svelte"
  import type { DemoSection } from "./demo-data"

  const titles: Record<DemoSection, string> = {
    home: "A little space for us",
    watch: "Our watchlist",
    ideas: "Things we could do",
    calendar: "Time together",
    notes: "Notes & discussion",
    settings: "Space settings",
  }
  let section = $state<DemoSection>("home")
  let dialog = $state("")
  let query = $state("")
  function addAction() {
    dialog =
      section === "calendar"
        ? "event"
        : section === "ideas"
          ? "idea"
          : section === "notes"
            ? "note"
            : "invite"
  }
</script>

<svelte:head
  ><title>Common Ground · Sample demo</title><meta
    name="description"
    content="Explore a sample Common Ground space without signing in."
  /></svelte:head
>
<div class="min-h-dvh bg-muted/30 text-foreground">
  <div class="border-b border-primary/15 bg-primary/5 px-4 py-2 text-center text-sm">
    <strong>Sample demo</strong><span class="mx-2 text-muted-foreground">·</span>Sample data only;
    changes aren't saved.<a
      class="ml-2 inline-flex items-center gap-1 font-medium text-primary hover:underline"
      href="#/auth/sign-in"><ArrowLeft class="size-3.5" />Back to sign in</a
    >
  </div>
  <div class="mx-auto flex min-h-[calc(100dvh-41px)] max-w-[1440px]">
    <DemoSideNav
      {section}
      onSelect={(next) => (section = next)}
      onAbout={() => (dialog = "about")}
    />
    <main class="min-w-0 flex-1">
      <DemoTopBar
        {query}
        onQuery={(value) => (query = value)}
        onAction={(action) => (dialog = action)}
      />
      <div class="mx-auto max-w-6xl px-4 py-6 pb-24 md:px-8 md:py-9">
        <DemoHeading {section} title={titles[section]} onAdd={addAction} />
        {#if section === "home"}<DemoHome
            onGo={(next) => (section = next as DemoSection)}
          />{:else if section === "watch"}<DemoWatch
            {query}
            onAction={(action) => (dialog = action)}
          />{:else if section === "ideas"}<DemoIdeas
            onAction={(action) => (dialog = action)}
          />{:else if section === "calendar"}<DemoCalendar
            onAction={(action) => (dialog = action)}
          />{:else if section === "notes"}<DemoNotes
            onAction={(action) => (dialog = action)}
          />{:else}<DemoSettings onAction={(action) => (dialog = action)} />{/if}
      </div>
      <DemoMobileNav {section} onSelect={(next) => (section = next)} />
    </main>
  </div>
  {#if dialog}<DemoDialog kind={dialog} onClose={() => (dialog = "")} />{/if}
</div>
