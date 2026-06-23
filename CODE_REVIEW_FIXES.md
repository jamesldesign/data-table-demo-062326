# Code Review Fixes

This document summarizes the quality fixes applied after a code review of the
prototype. Each in-code change is also marked with a `CHANGED:`/`ADDED:` comment
at the relevant line.

All fixes were verified locally:

- `npx tsc --noEmit` → passes
- `npx eslint .` → 0 errors (one inherent TanStack/React-Compiler warning remains)
- `npx next build` → succeeds (now actually type-checks, see #1)

## High priority

1. **Stopped ignoring TypeScript errors at build time.**
   `next.config.mjs` had `typescript.ignoreBuildErrors: true` (a v0 default),
   which let type errors ship silently. Flipped to `false` so the build fails on
   type errors. Verified the build still passes with checking enabled.

2. **Fixed the broken `lint` script.**
   `package.json` defined `"lint": "eslint ."`, but ESLint and its config were
   never installed, so the script failed. Added `eslint` + `eslint-config-next`
   as dev dependencies and created `eslint.config.mjs`. The config uses
   `eslint-config-next`'s native ESLint 9 flat config (its default export already
   bundles Core Web Vitals + TypeScript rules).

3. **Made dark mode actually work.**
   `app/layout.tsx` advertised `light dark` color scheme, but the table
   hardcoded light colors (`bg-neutral-100/50`, `bg-white`) and a black pinning
   shadow, which broke in dark mode. Replaced these with semantic theme tokens
   (`bg-muted`, `bg-background`) and switched the pinned-edge shadow to a
   `--border`-based color via `color-mix`, so the table now respects the theme
   (including the automatic `prefers-color-scheme: dark`).

## Medium priority

4. **Decoupled the "Sticky edges" toggle from pinning internals.**
   The toggle state was inferred from `columnPinning.left.length`. Added a
   dedicated `stickyEdges` boolean state in `components/data-table.tsx` so the
   switch can't desync if columns are ever pinned independently.

5. **Updated placeholder metadata.**
   Replaced the default `v0 App` / `Created with v0` title and description in
   `app/layout.tsx` and removed the leftover `generator: 'v0.app'` field.

6. **Repo hygiene: moved screenshots out of the project root.**
   ~20 debugging PNGs (`table.png`, `scroll-final.png`, `sticky-edges.png`, …)
   were committed to the repo root. Moved them to `docs/screenshots/`.

## Low priority / polish

7. **CSV export now also quotes carriage returns (`\r`)**, not just `\n` and
   `,`/`"`, so values pasted from Windows/Excel keep their structure
   (`components/data-table.tsx`).

8. **Bumped the TypeScript `target` from `ES6` to `ES2017`** in `tsconfig.json`
   (more appropriate for a React 19 / Next 16 app).

9. **Removed a dead `eslint-disable-next-line` directive** in
   `components/data-table-columns.tsx` that ESLint flagged as unnecessary.

## Intentionally deferred

These were noted in the review but **not** changed, to avoid unverifiable visual
regressions or scope creep:

- **Column `size` values only affect pinned columns.** Applying explicit widths
  to every column would rework the content-based sizing model and risks visual
  regressions that can't be confirmed without a browser. Left as-is.
- **The "Notes" field is an uncontrolled input** (commits on blur). Edits can be
  lost if the row unmounts before blur (e.g. clicking Expand). Acceptable for a
  demo; would need a controlled value to fix robustly.
- **Clipboard "Copy project ID" gives no toast feedback** — adding a toast system
  was out of scope for these fixes.
