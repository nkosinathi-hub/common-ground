<script lang="ts">
  import type { Snippet } from "svelte"
  import { Download } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import type { Result } from "@/shared/domain"
  import { toast } from "@/shared/ui"
  import type { ExportFile, SpaceRef } from "../application/account-service"
  import { useAccount } from "./context"
  import { Capacitor } from "@capacitor/core"
  import { downloadFile } from "./download"
  import { shareFile } from "./share-file"

  interface Props {
    spaces: readonly SpaceRef[]
    /** Below the rows, e.g. where catalog listings come from. */
    footer?: Snippet
  }

  let { spaces, footer }: Props = $props()
  const { service } = useAccount()
  let busy = $state<string | null>(null)

  async function save(key: string, load: () => Promise<Result<ExportFile>>) {
    busy = key
    try {
      const file = await load()
      if (!file.ok) return toast.error(file.error.message)
      if (Capacitor.isNativePlatform()) await shareFile(file.value)
      else downloadFile(file.value)
    } finally {
      busy = null
    }
  }
</script>

{#snippet row(title: string, description: string, action: string, label: string, run: () => void)}
  <div class="flex items-center justify-between gap-item">
    <div class="flex min-w-0 flex-col gap-hairline">
      <p class="type-label text-foreground">{title}</p>
      <p class="type-sm text-muted-foreground">{description}</p>
    </div>
    <Button variant="outline" size="sm" aria-label={label} disabled={busy !== null} onclick={run}>
      <Download aria-hidden="true" />{action}
    </Button>
  </div>
{/snippet}

<!-- Figma D18b Your data: one row per download, then what exports never hold. -->
<Card.Root>
  <Card.Header>
    <Card.Title>Your data</Card.Title>
    <Card.Description>
      Download a POPIA copy. A space export includes everything its members added.
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-stack">
    {@render row(
      "Download my data",
      "Your profile, email, spaces and contribution counts, as JSON.",
      "Download",
      "Download my data",
      () => void save("me", service.exportMe),
    )}
    {#each spaces as space (space.id)}
      {@render row(
        `Export ${space.name}`,
        "Space details, members' display names and shared content.",
        "Export",
        `Export ${space.name}`,
        () => void save(space.id, () => service.exportSpace(space)),
      )}
    {/each}
    <p class="type-xs text-muted-foreground">
      Exports never include invite links, notifications, file download links or other members' email
      addresses.
    </p>
    {@render footer?.()}
  </Card.Content>
</Card.Root>
