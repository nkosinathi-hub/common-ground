import "@testing-library/jest-dom/vitest"

// jsdom has no matchMedia; svelte/reactivity's MediaQuery reads it. Tests see a narrow screen
// unless one replaces this.
if (typeof window.matchMedia !== "function")
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (media: string): MediaQueryList =>
      ({
        matches: false,
        media,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  })
