import { DEFAULT_PROFILE } from "../domain/look"
import type { Space } from "../domain/space"

/** A space with the database defaults, named after its id unless the test says otherwise. */
export const sampleSpace = (overrides: Partial<Space> & Pick<Space, "id">): Space => ({
  name: overrides.id,
  template: "blank",
  role: "owner",
  ...DEFAULT_PROFILE,
  ...overrides,
})
