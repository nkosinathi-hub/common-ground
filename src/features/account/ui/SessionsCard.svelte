<script lang="ts">
  import { LogOut } from "@lucide/svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"

  interface Props {
    onSignOutEverywhere: () => void
  }

  let { onSignOutEverywhere }: Props = $props()
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Signed-in devices</Card.Title>
    <Card.Description>
      Lost a phone, or signed in somewhere you no longer trust? This signs out every device,
      including this one.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Button type="button" variant="outline" onclick={onSignOutEverywhere}
      ><LogOut aria-hidden="true" />Sign out everywhere…</Button
    >
  </Card.Content>
</Card.Root>
