<script lang="ts">
  import { toast, type Resource } from "@/shared/ui"
  import type { MemberProgress } from "../domain/progress-types"
  import { withRating } from "../domain/rating"
  import { useWatch } from "./context"
  import StarRating from "./StarRating.svelte"

  interface Props {
    itemId: string
    /** The title's progress, shared with the progress panel so both stay in step. */
    progress: Resource<MemberProgress>
    onSaved: () => void
  }

  let { itemId, progress, onSaved }: Props = $props()
  const { service } = useWatch()
  const mine = $derived(progress.value?.entries.find((p) => p.userId === progress.value?.me))
  let saving = $state(false)

  async function rate(rating: number | null) {
    saving = true
    const saved = await service.saveProgress(itemId, withRating(mine ?? null, rating))
    saving = false
    if (!saved.ok) return toast.error(saved.error.message)
    toast.success(rating === null ? "Rating cleared" : "Rating saved")
    onSaved()
  }
</script>

<StarRating value={mine?.rating ?? null} onchange={rate} disabled={saving || !progress.value} />
