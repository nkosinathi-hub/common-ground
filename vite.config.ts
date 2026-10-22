import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"
import { cspPlugin } from "./scripts/vite/csp"
import { playbackPlugins } from "./src/app/composition/playback"
import { fixtureBuild } from "./src/app/composition/playback-fixture"
import { cspOrigins } from "./src/features/playback/domain/csp-origins"

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

const env = (mode: string) => loadEnv(mode, process.cwd(), "VITE_")

/** Playback origins come only from the compiled-in plugins (docs/playback-plugins.md). */
// The end-to-end build alone names a loopback media server, and only it may use http.
const playback = (mode: string) => {
  const fixture = fixtureBuild(env(mode).VITE_PLAYBACK_FIXTURE_ORIGIN)
  const build = { jellyfinOrigin: env(mode).VITE_JELLYFIN_ORIGIN || undefined, ...fixture }
  return cspOrigins(playbackPlugins(build), { allowLoopback: !!fixture.fixtureOrigin })
}

export default defineConfig(({ mode }) => ({
  base: process.env.PAGES_BASE_PATH ?? "/",
  plugins: [
    tailwindcss(),
    svelte(),
    ...(process.env.VITEST
      ? []
      : [
          cspPlugin(
            env(mode).VITE_SUPABASE_URL ?? "",
            mode === "app" ? (env(mode).VITE_PUBLIC_APP_URL ?? "") : "",
            playback(mode),
          ),
        ]),
  ],
  resolve: {
    ...(process.env.VITEST ? { conditions: ["browser"] } : {}),
    alias: { $lib: src("lib"), "@": src("") },
  },
  build: { sourcemap: false, target: "es2023" },
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.test.ts",
      "supabase/functions/_shared/**/*.test.ts",
      "scripts/**/*.test.ts",
      "extension/**/*.test.ts",
    ],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/**/domain/**",
        "src/**/application/**",
        "src/**/infrastructure/**",
        "src/app/routing/**",
        "src/shared/domain/**",
        "src/**/*.svelte.ts",
        "supabase/functions/_shared/**",
      ],
      exclude: ["**/*.test.ts", "**/index.ts", "**/ports.ts", "**/types.ts", "**/*.types.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
}))
