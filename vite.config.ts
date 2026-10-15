import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"
import { cspPlugin } from "./scripts/vite/csp"

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

export default defineConfig(({ mode }) => ({
  base: process.env.PAGES_BASE_PATH ?? "/",
  plugins: [
    tailwindcss(),
    svelte(),
    ...(process.env.VITEST
      ? []
      : [cspPlugin(loadEnv(mode, process.cwd(), "VITE_").VITE_SUPABASE_URL ?? "")]),
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
    ],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/**/domain/**",
        "src/**/application/**",
        "src/shared/domain/**",
        "src/**/*.svelte.ts",
        "supabase/functions/_shared/**",
      ],
      exclude: ["**/*.test.ts", "**/index.ts", "**/ports.ts", "**/types.ts", "**/*.types.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
}))
