/**
 * The Figma plugin script that exports the design file's variables and styles. Run it through
 * the Figma MCP `use_figma` tool on file pQC2lr3ooWFwMLs3UFP0wc, save the returned JSON, then
 * `pnpm design:tokens --from-figma <file>`. See docs/design/README.md.
 */
export const FIGMA_EXPORT_SCRIPT = `
const hex = (c) => "#" + [c.r, c.g, c.b, c.a ?? 1].filter((x, i) => i < 3 || x < 1)
  .map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")
const collections = []
for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
  const variables = []
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id)
    const values = []
    for (const m of c.modes) {
      const raw = v.valuesByMode[m.modeId]
      if (raw && raw.type === "VARIABLE_ALIAS")
        values.push({ alias: (await figma.variables.getVariableByIdAsync(raw.id)).name })
      else values.push(typeof raw === "object" ? hex(raw) : raw)
    }
    variables.push({ name: v.name, values })
  }
  collections.push({ name: c.name, modes: c.modes.map((m) => m.name), variables })
}
const text = (await figma.getLocalTextStylesAsync()).map((s) => ({
  name: s.name, family: s.fontName.family, style: s.fontName.style, size: s.fontSize,
  lineHeight: s.lineHeight.value,
  tracking: s.letterSpacing.unit === "PERCENT" ? s.letterSpacing.value / 100 + "em" : s.letterSpacing.value + "px",
}))
const effects = (await figma.getLocalEffectStylesAsync()).map((s) => ({
  name: s.name,
  shadows: s.effects.filter((e) => e.type === "DROP_SHADOW").map((e) => ({
    x: e.offset.x, y: e.offset.y, blur: e.radius, spread: e.spread ?? 0, color: hex(e.color),
  })),
}))
return { collections, text, effects }
`
