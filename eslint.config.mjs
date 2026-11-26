import eslintReact from "@eslint-react/eslint-plugin"
import next from "@next/eslint-plugin-next"
import { defineConfig, globalIgnores } from "eslint/config"
import prettier from "eslint-config-prettier/flat"
import { flatConfigs as importX } from "eslint-plugin-import-x"
import jsxA11y from "eslint-plugin-jsx-a11y-x"
import reactHooks from "eslint-plugin-react-hooks"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
  tseslint.configs.recommended,
  eslintReact.configs["recommended-typescript"],
  reactHooks.configs.flat.recommended,
  eslintReact.configs["disable-conflict-eslint-plugin-react-hooks"],
  jsxA11y.configs.recommended,
  next.configs["core-web-vitals"],
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: { "import-x": importX.recommended.plugins["import-x"] },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { "import-x/no-anonymous-default-export": "warn" },
  },
  prettier,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts"]),
])
