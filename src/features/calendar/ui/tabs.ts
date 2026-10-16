// The shared trigger styles its active state with data-active, which bits-ui does not set (it
// sets data-state), and its muted text misses 4.5:1 on the list. Ours mark the active tab.
export const TAB =
  "text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:bg-input/30"
