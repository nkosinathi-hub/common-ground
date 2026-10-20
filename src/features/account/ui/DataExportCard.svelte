<script lang="ts">
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
  }

  let { spaces }: Props = $props()
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

<Card.Root>
  <Card.Header>
    <Card.Title>Your data</Card.Title>
    <Card.Description>
      Download a JSON copy. A space export includes everything its members added.
    </Card.Description>
  </Card.Header>
  <Card.Content class="grid gap-2">
    <Button
      variant="outline"
      class="w-fit"
      disabled={busy !== null}
      onclick={() => save("me", service.exportMe)}
    >
      <Download aria-hidden="true" /> Download my data
    </Button>
    {#each spaces as space (space.id)}
      <Button
        variant="outline"
        class="w-fit"
        disabled={busy !== null}
        onclick={() => save(space.id, () => service.exportSpace(space))}
      >
        <Download aria-hidden="true" /> Export {space.name}
      </Button>
    {/each}
  </Card.Content>
</Card.Root>
