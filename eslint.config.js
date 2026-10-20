import js from "@eslint/js"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import ts from "typescript-eslint"
import svelteConfig from "./svelte.config.js"

export default ts.config(
  {
    ignores: [
      ".claude/**",
      "dist",
      "coverage",
      "src/lib/components/ui",
      "**/database.types.ts",
      "supabase/functions/**/index.ts",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  ...svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { project: "./tsconfig.json", tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Fakes and adapters implement async ports with `async` so a throw becomes a rejection;
      // a missing await is caught by no-floating-promises instead.
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "svelte/no-at-html-tags": "error",
      "svelte/no-target-blank": "error",
      "svelte/button-has-type": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message: "Never render user HTML",
        },
      ],
    },
  },
  // svelte-eslint-parser leaves template expressions, snippet parameters and `generics` partly
  // untyped, so these rules misfire on .svelte files; svelte-check (--fail-on-warnings) types them.
  {
    files: ["**/*.svelte"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  // Config files, plain JS and the Deno-only Edge Function files are outside tsconfig: lint them
  // without type information.
  {
    files: ["**/*.js", "supabase/functions/*/*.ts"],
    ...ts.configs.disableTypeChecked,
  },
)
