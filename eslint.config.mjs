// ADDED: the `lint` script referenced `eslint .` but no ESLint config or
// dependencies existed, so `npm run lint` failed. eslint-config-next 16 ships a
// native ESLint 9 flat config (its default export is a flat config array that
// already bundles Core Web Vitals + TypeScript rules), so we spread it directly.
import next from "eslint-config-next"

const eslintConfig = [
  ...next,
  { ignores: [".next/**", "node_modules/**"] },
]

export default eslintConfig
