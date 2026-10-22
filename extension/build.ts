import { execFileSync } from "node:child_process"
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { build, loadEnv } from "vite"
import { manifestFor } from "./manifest"

// pnpm extension:build: bundles the extension with the app's own parties code (src/features/
// parties) from separate entries, writes extension/dist and extension/common-ground-extension.zip.
const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const root = at("../")
const dist = at("./dist/")
const zip = at("./common-ground-extension.zip")

const env = { ...loadEnv("production", root, "VITE_"), ...process.env }
const supabaseUrl = env.VITE_SUPABASE_URL ?? ""
if (!supabaseUrl || !env.VITE_SUPABASE_ANON_KEY)
  throw new Error("extension:build needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
const { version } = JSON.parse(readFileSync(at("../package.json"), "utf8")) as { version: string }

rmSync(dist, { recursive: true, force: true })
rmSync(zip, { force: true })
mkdirSync(dist, { recursive: true })

// Content scripts cannot be modules, so each entry is one self-contained IIFE.
for (const entry of ["content", "page", "popup"]) {
  await build({
    configFile: false,
    root,
    envDir: root,
    publicDir: false,
    logLevel: "warn",
    resolve: { alias: { "@": at("../src/"), $lib: at("../src/lib/") } },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      outDir: dist,
      emptyOutDir: false,
      sourcemap: false,
      target: "es2022",
      minify: true,
      lib: {
        entry: at(`./src/${entry}.ts`),
        formats: ["iife"],
        name: `commonGround_${entry}`,
        fileName: () => `${entry}.js`,
      },
    },
  })
}

copyFileSync(at("./popup.html"), `${dist}popup.html`)
copyFileSync(at("./popup.css"), `${dist}popup.css`)
copyFileSync(at("../public/icon-192.png"), `${dist}icon.png`)
const manifest = manifestFor(supabaseUrl, version)
writeFileSync(`${dist}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`)
execFileSync("zip", ["-q", "-r", "-X", zip, "."], { cwd: dist })
console.log(`extension: ${dist} and ${zip}`)
