<script lang="ts">
  import * as Card from "$lib/components/ui/card"
  import { Attribution } from "@/features/catalog"
</script>

<!-- TMDB and JustWatch credits live here, with your data, not on every catalog page (Nkosi). -->
<Card.Root>
  <Card.Header>
    <Card.Title>Where listings come from</Card.Title>
    <Card.Description>Titles, posters and where to watch come from these sources.</Card.Description>
  </Card.Header>
  <Card.Content><Attribution compact /></Card.Content>
</Card.Root>
