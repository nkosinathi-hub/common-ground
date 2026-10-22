import { execFileSync } from "node:child_process"
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { build, loadEnv } from "vite"
import { manifestFor, type Target } from "./manifest"

// pnpm extension:build: bundles the extension with the app's own parties code (src/features/
// parties) from separate entries, then one folder and zip per browser: extension/dist (Chrome and
// Edge) with common-ground-extension.zip, extension/dist-firefox with ...-extension-firefox.zip.
const at = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const root = at("../")
const dist = at("./dist/")
const zips: Record<Target, string> = {
  chromium: at("./common-ground-extension.zip"),
  firefox: at("./common-ground-extension-firefox.zip"),
}
const firefoxDist = at("./dist-firefox/")

const env = { ...loadEnv("production", root, "VITE_"), ...process.env }
const supabaseUrl = env.VITE_SUPABASE_URL ?? ""
if (!supabaseUrl || !env.VITE_SUPABASE_ANON_KEY)
  throw new Error("extension:build needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")
const { version } = JSON.parse(readFileSync(at("../package.json"), "utf8")) as { version: string }

for (const path of [dist, firefoxDist, ...Object.values(zips)])
  rmSync(path, { recursive: true, force: true })
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
cpSync(dist, firefoxDist, { recursive: true })
for (const [target, folder] of [
  ["chromium", dist],
  ["firefox", firefoxDist],
] as const) {
  const manifest = manifestFor(supabaseUrl, version, target)
  writeFileSync(`${folder}manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`)
  execFileSync("zip", ["-q", "-r", "-X", zips[target], "."], { cwd: folder })
  console.log(`extension (${target}): ${folder} and ${zips[target]}`)
}
