/** The add-title dialog's two ways in (S03, S04), and the heading each one shows. */
export type AddMode = "search" | "manual"

export const ADD_MODES: readonly { value: AddMode; label: string }[] = [
  { value: "search", label: "Search catalog" },
  { value: "manual", label: "Enter manually" },
]

export const ADD_COPY: Record<AddMode, { title: string; description: string }> = {
  search: {
    title: "Add something good",
    description: "Search the catalog and add as many titles as you like.",
  },
  manual: { title: "Add a title manually", description: "Not in the catalog? Add it by hand." },
}
