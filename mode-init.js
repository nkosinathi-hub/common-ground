// Applies the saved light or dark choice before the app loads, so dark mode never flashes light.
// A file rather than inline because the CSP forbids inline scripts. Mirrors mode-watcher's keys.
;(function () {
  try {
    var mode = localStorage.getItem("mode-watcher-mode")
    var system = window.matchMedia("(prefers-color-scheme: dark)").matches
    var dark = mode === "dark" || (mode !== "light" && system)
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.style.colorScheme = dark ? "dark" : "light"
  } catch {
    // Storage can be blocked; the app then applies the mode itself once it starts.
  }
})()
