<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
</script>

<main class="flex min-h-dvh items-center justify-center px-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <Card.Title>You have been invited</Card.Title>
      <Card.Description>
        Sign in or create an account to see and accept this invitation. We will bring you back here.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-wrap gap-2">
      <Button href="#/auth/sign-in">Sign in</Button>
      <Button variant="outline" href="#/auth/sign-up">Create account</Button>
    </Card.Content>
  </Card.Root>
</main>
