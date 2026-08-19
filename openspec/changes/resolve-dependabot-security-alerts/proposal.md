# Resolve Dependabot Security Alerts + Refresh Stack to Latest Stable

## Discipline Skills

- `security-hardening` — this change is a security remediation; verify each
  installed version crosses its advisory's patched boundary and no new alert is
  introduced.
- `doubt-driven-review` — the vitepress 1.6.4 → 2.0.0-alpha upgrade is a
  non-trivial, pre-release dependency move; stress-test it (docs build/serve)
  before it stands.

## Why

Two goals, handled together because they touch the same manifests and single
lockfile:

1. **Clear 8 open Dependabot alerts** against `pnpm-lock.yaml`. All flagged
   packages are **dev/build-time** dependencies — none ship in the published
   package runtime — but the alerts must be cleared. The current lockfile has 8
   still present; 1 (launch-editor, #210) is already resolved (absent from the
   tree).
2. **Refresh the whole stack to latest stable.** An audit of every dependency
   across all 6 `package.json` files against npm `latest` found the stack is
   already near the leading edge: most packages are at latest, a band is within
   existing caret ranges (a lockfile refresh picks them up), and only two need a
   manifest edit (`oxfmt`, `@testing-library/jest-dom`).

### Alert inventory

| Alert | Package                           | Installed | Patched                         | Root path                    |
| ----- | --------------------------------- | --------- | ------------------------------- | ---------------------------- |
| #209  | vite (`server.fs.deny` bypass)    | 5.4.21    | 6.4.3 / 7.3.5 / 8.0.16 (no 5.x) | vitepress → vite@5           |
| #198  | vite (`.map` path traversal)      | 5.4.21    | 6.4.2 / 7.3.2 / 8.0.5 (no 5.x)  | vitepress → vite@5           |
| #101  | esbuild (dev-server CORS)         | 0.21.5    | 0.25.0                          | vitepress → vite@5 → esbuild |
| #227  | brace-expansion (DoS)             | 5.0.8     | 5.0.9                           | transitive                   |
| #228  | fast-uri (host confusion)         | 3.1.4     | 3.1.5                           | transitive                   |
| #202  | qs (`stringify` DoS)              | 6.15.1    | 6.15.2                          | transitive                   |
| #230  | postcss (`sourceMappingURL` read) | 8.5.19    | 8.5.23                          | transitive + vitepress opt   |
| #229  | react-router (RSC CSRF)*          | 7.18.1    | 7.18.2                          | example → react-router-dom   |

`*` #229 only triggers when the unstable RSC APIs are used; `packages/example`
uses plain `react-router-dom`, so real-world risk is nil — the version bump
clears the alert regardless.

`vite@8.1.5` (the direct devDependency) is already safe for #209/#198. The
vulnerable `vite@5.4.21` + `esbuild@0.21.5` exist **only** because
`vitepress@1.6.4` pins vite 5. There is no patched 5.x line of vite, so
clearing #209/#198/#101 requires moving vitepress off vite 5.

## What Changes

### Security remediation

1. **Upgrade `vitepress`** `^1.6.3` → `^2.0.0-alpha.19` (root devDependency).
   vitepress 2.x depends on `vite@^8.2.0` + `@vitejs/plugin-vue@^6.0.8`, which
   pulls vite ≥ 8.0.16 and esbuild ≥ 0.27 — clearing #209, #198, #101 by
   removing the vite@5 / esbuild@0.21 subtree entirely.
2. **Add `pnpm.overrides`** in root `package.json` to force patched transitive
   leaves: `brace-expansion` → 5.0.9, `fast-uri` → 3.1.5, `qs` → 6.15.2,
   `postcss` → 8.5.23 (#227, #228, #202, #230).
3. **Bump `react-router-dom`** `^7.18.1` → `^7.18.2` in
   `packages/example/package.json` (#229).

### Stack freshness

4. **`pnpm update` within existing carets** (no manifest edit) refreshes:
   `@types/node` 26.1.1→26.2.0, `vite` 8.1.5→8.2.1, `vitest`/`@vitest/*`
   4.1.10→4.1.11, `@vitejs/plugin-react` 6.0.4→6.0.5, `rollup` 4.62.3→4.62.4,
   `jsdom` 30.0.0→30.0.1, `@types/react` 19.2.17→19.2.18, `@types/react-dom`
   19.2.3→19.2.4, `@mui/material`+`@mui/icons-material` 9.2.0→9.3.1, `oxlint`
   1.74.0→1.79.0.
5. **Bump `oxfmt`** `^0.61.0` → `^0.64.0` (a 0.x caret locks to minor, so the
   floor must move). Expect a one-time formatting-output churn — run
   `oxfmt --write` as its own step.
6. **Bump `@testing-library/jest-dom`** `^6.9.1` → `^7.0.1` in
   `packages/react-hooks`. v7 breaking changes are non-issues here: min Node 22
   (repo requires ≥24) and `@testing-library/dom` peer already present via
   `@testing-library/react@16`. Additive matchers only.
7. **Regenerate `pnpm-lock.yaml`** and verify vulnerable versions are gone and
   refreshed versions resolved.

**Already at latest — untouched:** `typescript` 7.0.2,
`@typescript/typescript6` 6.0.2, `vite-plugin-dts` 5.0.3, `react`/`react-dom`
19.2.8, `@emotion/*`, `@testing-library/react` 16.3.2, `http-server` 14.1.1,
`picomatch` 4.0.5, `reflect-metadata` 0.2.2.

### Key risk (accepted by decision)

vitepress 2.x is a **pre-release alpha** (`latest` dist-tag is still 1.6.4).
This is the one place the two goals conflict: a strict "latest stable" reading
would keep vitepress at 1.6.4, but 1.x has no vite-6+ path so it cannot clear
#209/#198/#101. **Decision: security-first** — adopt vitepress 2.x alpha to
evict the vite@5/esbuild@0.21 subtree. The docs site (`docs-site/`) may need
config/theme migration. This change is gated on a successful `docs:build` +
`docs:dev` smoke test. If vitepress 2 proves unstable, the fallback is to keep
vitepress 1.6.4 and dismiss #209/#198/#101 as dev-only (exploitable only with
the docs dev server network-exposed via `--host` on Windows) — but that
fallback is out of scope for this change.

## Impact

- **Affected files:** root `package.json` (vitepress, oxfmt, `pnpm.overrides`),
  `packages/example/package.json` (react-router-dom),
  `packages/react-hooks/package.json` (jest-dom), `pnpm-lock.yaml`, source files
  reformatted by oxfmt 0.64, possibly `docs-site/.vitepress/config.*` if
  migration is required.
- **No runtime/published-package impact** — all changes are dev/build tooling.
- **CI:** existing `pnpm test` / `pnpm build` must stay green; docs build must
  succeed on the new vitepress.
