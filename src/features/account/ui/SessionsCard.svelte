<script lang="ts">
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
      Lost a phone, or signed in somewhere you no longer use? This signs out every device, this one
      too. Changing your password signs out the others for you.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Button type="button" variant="outline" onclick={onSignOutEverywhere}
      >Sign out everywhere</Button
    >
  </Card.Content>
</Card.Root>
