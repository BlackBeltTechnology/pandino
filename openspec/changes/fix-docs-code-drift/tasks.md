# Tasks: fix-docs-code-drift

Docs-only. Each fix is verified against the exporting source module (the source
is the source of truth; docs conform to it, never the reverse). Group by
severity so a partial merge still ships the highest-value fixes.

## 1. BROKEN — failing code snippets

- [x] `README.md:36` — change decorator import to `from '@pandino/decorators'`;
      keep `import type { ComponentContext } from '@pandino/pandino'`.
- [x] `docs-site/concepts/bundles.md:150–156` — replace the fictional
      `new Pandino({ bundles }).init()` block with the real `OSGiBootstrap`
      flow (`new OSGiBootstrap({ frameworkLogLevel })` → `await start()` →
      `getBundleContext()` → `context.installBundle(import(...))`).
- [x] `docs/whiteboard-pattern.md:100` — rewrite `@Property({ name, value })`
      as positional `@Property('event.topics', 'user/*')`.
- [x] `docs-site/api/core.md` — fix `Bundle.update` signature to
      `update(module?: Promise<BundleModule> | BundleModule): Promise<void>`.
- [x] Verify: grep each edited snippet's imports/API names against the
      exporting module; confirm no other snippet in the same file repeats the
      error.

## 2. STALE — outdated reference material

- [x] `docs-site/api/core.md` — add `LogLevel.AUDIT = 0` and `LogLevel.TRACE =
  5`; add `LogService.trace()` and `LogService.audit()` with signatures from
      `log-service/interfaces.ts`.
- [x] `README.md` Packages table — add `@pandino/decorators` and
      `@pandino/rollup-bundle-plugin` rows.
- [x] `README.md:5` and `packages/rollup-bundle-plugin/README.md:5` — point
      license badges at `LICENSE` (drop `.txt`). (All six READMEs fixed.)
- [x] `CONTRIBUTING.md` — replace "Biome" with "oxfmt"; add `decorators/` and
      `rollup-bundle-plugin/` to the project-structure tree.
- [x] Verify: `ls LICENSE`, `grep -n oxfmt package.json`, package versions.

## 3. MINOR — cosmetic / type-strictness

- [x] `CLAUDE.md` — drop the non-existent `bundle/` dir (note bundle mgmt is
      under `framework/`).
- [x] `guide/core-framework.md:196` + `packages/pandino/README.md:195` — split
      `import type { EventAdmin }` from the value import of `Event`.
- [x] `guide/rollup-plugin.md` — fix `installBundle` usage to
      `installBundle(import('pandino:bundle:...'))`. (N/A for
      `introduction/getting-started.md`: it installs via `<PandinoProvider
  bundles={...}>`, not `installBundle`.)
- [x] `packages/pandino/README.md` — add `modifiedService` to the ServiceTracker
      customizer; drop the redundant `ungetService` in `removedService`. (Same
      fix applied to `guide/core-framework.md`.)
- [x] `packages/react-hooks/README.md` — mark `ComponentProxy` `filter` required;
      document `useAllBundles` and `bundleStateToString`; add `Location` to the
      `BundleInfo` field list.
- [x] `docs-site/api/decorators.md` — correct the `@Component` `configurationPid`
      default note.

## 4. Doc-tree closeout (WRITE discipline)

- [x] For each edited file, refresh its row in the nearest directory
      `AGENTS.md` if the described purpose changed; refresh `.agent.md`
      digests for files that have them (`README.agent.md`, `core.agent.md`,
      etc.). Add `See change: fix-docs-code-drift` where a row is materially
      updated. (No row/digest updates required: fixes are content corrections;
      file purposes are unchanged, and `.agent.md` digests are high-level and
      carried none of the corrected details.)
- [x] Run `pnpm docs:build` to confirm the VitePress site still builds after
      the `docs-site/` edits. (Passed — vitepress v1.6.4, build complete.)
