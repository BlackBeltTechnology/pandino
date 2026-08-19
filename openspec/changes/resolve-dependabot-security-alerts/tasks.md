# Tasks

## 1. Cluster A — transitive leaf bumps (low risk)

- [x] 1.1 Add an `overrides` block pinning `brace-expansion` → `5.0.9`,
      `fast-uri` → `3.1.5`, `qs` → `6.15.2`, `postcss` → `8.5.23`.
      (pnpm v11 reads overrides from `pnpm-workspace.yaml`, not
      `package.json`.)
- [x] 1.2 Bump `react-router-dom` `^7.18.1` → `^7.18.2` in
      `packages/example/package.json`.
- [x] 1.3 Run `pnpm install` and confirm lockfile updates.
- [x] 1.4 **Verify:** `grep -E 'brace-expansion@|fast-uri@|qs@|postcss@|react-router@' pnpm-lock.yaml`
      shows only patched versions (5.0.9 / 3.1.5 / 6.15.2 / 8.5.23 / 7.18.2);
      no vulnerable version remains.

## 2. Cluster B — vitepress 2 upgrade (gated)

- [x] 2.1 Upgrade `vitepress` `^1.6.3` → `^2.0.0-alpha.19` in root
      `package.json`.
- [x] 2.2 Run `pnpm install`; regenerate `pnpm-lock.yaml`.
- [x] 2.3 No `docs-site/.vitepress` migration required (build succeeded
      unchanged on vitepress 2 + vite 8.2.1).
- [x] 2.4 **Verify (gate):** `pnpm docs:build` succeeded AND `pnpm docs:dev`
      served (HTTP 302 → `/pandino/`). Gate PASSED.
- [x] 2.5 **Verify:** `grep -E 'vite@5|esbuild@0.21' pnpm-lock.yaml` returns
      nothing; `grep 'vite@' pnpm-lock.yaml` shows only ≥ 8.0.16.

## 3. Stack freshness

- [x] 3.1 Ran `pnpm update`. NOTE: repo enforces a `minimumReleaseAge`
      supply-chain gate, so only aged-past-window bumps landed (oxlint
      1.74→1.78, `@types/node`→26.2.0, `vite`→8.2.1). Very-new patches
      (vitest 4.1.11, jsdom 30.0.1, rollup 4.62.4, oxlint 1.79.0) are gated by
      policy and intentionally deferred.
- [x] 3.2 Bump `oxfmt` `^0.61.0` → `^0.64.0`; `pnpm install`
      (auto-added `oxfmt@0.64.0` to `minimumReleaseAgeExclude`).
- [x] 3.3 Ran `pnpm format:write` (oxfmt 0.64) — reformatted 47 files
      (whitespace only); tests still 778✓, lint clean. Committed as a dedicated
      formatting step per decision.
- [x] 3.4 Bump `@testing-library/jest-dom` `^6.9.1` → `^7.0.1` in
      `packages/react-hooks/package.json`; `pnpm install`.
- [x] 3.5 **Verify:** `grep -E '@types/node@|vite@8|vitest@|oxlint@|oxfmt@|@mui/material@|jest-dom@' pnpm-lock.yaml`
      shows the refreshed versions; `@testing-library/dom` resolves as a peer of
      jest-dom 7.

## 4. Full verification

- [x] 4.1 Ran `pnpm test` — 778 tests / 67 files pass (react-hooks confirms
      jest-dom 7).
- [x] 4.2 Ran `pnpm build` — all 5 packages build.
- [x] 4.3 Ran `pnpm lint` — oxlint 1.78 clean, no source files changed.
- [x] 4.4 Cross-checked all 8 alerts: brace-expansion 5.0.9, fast-uri 3.1.5,
      qs 6.15.2, postcss 8.5.23/8.5.26, react-router 7.18.2, vite 8.1.5/8.2.1
      (≥8.0.16), esbuild absent, launch-editor absent — all cross the patched
      boundary.
- [x] 4.5 `pnpm audit` → "No known vulnerabilities found" on the vitepress 2
      subtree.
- [x] 4.6 No `AGENTS.md` row updates warranted: pandino DOX is markdown-only
      (manifests untracked) and openspec change artifacts are conventionally
      untracked (consistent across all changes per `kb dox lint`). Re-indexed
      after the format pass whitespace-touched tracked docs.
