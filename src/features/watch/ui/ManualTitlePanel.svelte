<script lang="ts">
  import { Info } from "@lucide/svelte"
  import * as Alert from "$lib/components/ui/alert"
  import { FormError, type FormState } from "@/shared/ui"
  import type { SharedIntent } from "../domain/types"
  import AddToField from "./AddToField.svelte"
  import type { TitleFormState } from "./title-form-state.svelte"
  import TitleFields from "./TitleFields.svelte"

  interface Props {
    fields: TitleFormState
    submission: FormState
    intent: SharedIntent
  }

  let { fields, submission, intent = $bindable() }: Props = $props()
</script>

<!-- Figma S04: the list, the title's few facts, the rest folded, and what by hand means. -->
<AddToField bind:value={intent} />
<TitleFields form={fields} prefix="manual" folded errorFor={(f) => submission.fieldError(f)} />
<Alert.Root role="note">
  <Info aria-hidden="true" />
  <Alert.Description
    >Manual titles have no provider data. You can edit the title and note later.</Alert.Description
  >
</Alert.Root>
<FormError message={submission.formError} />
