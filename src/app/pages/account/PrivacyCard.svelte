<script lang="ts">
  import { ChevronRight } from "@lucide/svelte"
  import * as Card from "$lib/components/ui/card"
  import { buildHash, type PrivacyPart } from "@/shared/domain"

  const PARTS: { part: PrivacyPart; title: string; description: string }[] = [
    {
      part: "store",
      title: "What we store",
      description: "Profile, spaces and what members share, and how long each is kept.",
    },
    {
      part: "rights",
      title: "Your rights",
      description: "See, download, correct or delete your information at any time.",
    },
  ]
</script>

<!-- Figma D18b Privacy: the two parts of the notice, each a row that opens it. -->
<Card.Root>
  <Card.Header>
    <Card.Title>Privacy</Card.Title>
    <Card.Description
      >What Common Ground keeps about you, and the rights you have over it.</Card.Description
    >
  </Card.Header>
  <Card.Content class="flex flex-col">
    {#each PARTS as row (row.part)}
      <a
        href={buildHash({ name: "privacy", part: row.part })}
        class="-mx-related flex items-center gap-item rounded-md px-related py-related outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <span class="flex min-w-0 flex-1 flex-col gap-hairline">
          <span class="type-label text-foreground">{row.title}</span>
          <span class="type-sm text-muted-foreground">{row.description}</span>
        </span>
        <span class="flex items-center gap-hairline type-label text-primary"
          >Read<ChevronRight class="size-4" aria-hidden="true" /></span
        >
      </a>
    {/each}
  </Card.Content>
</Card.Root>
