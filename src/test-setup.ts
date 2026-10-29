import "@testing-library/jest-dom/vitest"

// jsdom has no matchMedia; svelte/reactivity's MediaQuery reads it. Tests see a wide screen
// (every min-width query matches), as components assumed before; a test can replace it.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function")
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (media: string): MediaQueryList =>
      ({
        matches: media.includes("min-width"),
        media,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  })
