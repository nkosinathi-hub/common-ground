<script lang="ts">
  import { onMount } from "svelte"
  import { Loading } from "@/shared/ui"
  import { SPACE } from "../demo/identity"
  onMount(() => location.replace(`${location.pathname}?demo=1#/s/${SPACE}/home`))
</script>

<Loading label="Opening the sample space" />
