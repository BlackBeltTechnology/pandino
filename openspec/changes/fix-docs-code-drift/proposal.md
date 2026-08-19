# Proposal: fix-docs-code-drift

## Why

A full audit of every README, the `docs-site/` VitePress tree, the `docs/`
pattern guides, and the root docs against actual source (`packages/*/src`)
found documentation that no longer matches the code. Three defects produce
copy-paste code that fails to import or silently misbehaves — including the
flagship "Quick Concept Demo" in the root `README.md`. Several reference pages
list wrong signatures, missing enum values, and stale tooling names.

Every finding below was verified twice: once by a per-area check and once
directly against source (`grep`/`read` of the exporting module).

## What Changes

Documentation-only edits. No application code, no public API changes.

### BROKEN (code that fails as written)

1. **`README.md:36`** — Quick Concept Demo imports `Component, Service,
Reference, Activate` from `@pandino/pandino`. Those are exported by
   `@pandino/decorators`; `pandino/src/index.ts` exports none of them. Fix the
   import package. (`import type { ComponentContext }` on line 37 is correct.)
2. **`docs-site/concepts/bundles.md:150–156`** — "Installing Bundles → At
   Bootstrap" uses `import Pandino from '@pandino/pandino'`, `new Pandino({
bundles })`, and `.init()`. None exist (no default export, no `Pandino`
   class, no `bundles` option, no `.init()`). Replace with the real
   `OSGiBootstrap` flow used elsewhere in the docs.
3. **`docs/whiteboard-pattern.md:100`** — `@Property({ name: 'event.topics',
value: 'user/*' })` uses the object form; `@Property(key, value)` is
   positional, so the property is never set and the handler never subscribes.
   Align with the positional form (the `docs-site` twin is already correct).
4. **`docs-site/api/core.md`** — `Bundle.update(source?: ReadableStream)` is
   wrong; actual signature is `update(module?: Promise<BundleModule> |
BundleModule)`.

### STALE (outdated / incomplete)

5. **`docs-site/api/core.md`** — `LogLevel` omits `AUDIT = 0` and `TRACE = 5`;
   `LogService` is missing `trace()` and `audit()` (both exist in source).
6. **`README.md`** — Packages table lists only `@pandino/pandino` and
   `@pandino/react-hooks`; add `@pandino/decorators` and
   `@pandino/rollup-bundle-plugin` (both referenced elsewhere in the file).
7. **`README.md:5` + `packages/rollup-bundle-plugin/README.md:5`** — License
   badges link to `LICENSE.txt`; the file is `LICENSE`. Fix dead links.
8. **`CONTRIBUTING.md:44`** — "Code formatting — We use Biome"; the project uses
   **oxfmt** (`format:write` → `oxfmt --write`). Also add `decorators/` and
   `rollup-bundle-plugin/` to the project-structure tree.

### MINOR (cosmetic / type-strictness)

9. `CLAUDE.md` lists a non-existent `bundle/` source dir (lives under
   `framework/`).
10. `guide/core-framework.md:196` and `packages/pandino/README.md:195`
    value-import the type-only `EventAdmin` (breaks under
    `verbatimModuleSyntax`) — split into `import type`.
11. `guide/rollup-plugin.md` and `introduction/getting-started.md` misuse
    `installBundle` (2nd arg / resolved module vs `Promise<BundleModule>`).
12. `packages/pandino/README.md` ServiceTracker snippet omits required
    `modifiedService` and double-ungets.
13. `packages/react-hooks/README.md` — `ComponentProxy` `filter` marked optional
    but is required; `useAllBundles` and `bundleStateToString` undocumented;
    `BundleInfo` field list undercounts (missing `Location`).
14. `docs-site/api/decorators.md` — `@Component` `configurationPid` "default =
    component name" is not what the decorator does.

## Non-goals

- No application/source code changes. Docs only.
- No new public API. If a doc is aspirational for an API that does not exist,
  the doc is corrected to match code — the code is not changed to match the doc.
- No restructure of the VitePress site or the AGENTS.md doc tree beyond
  refreshing rows whose described purpose changed.

## Discipline Skills

None of the `eng-disciplines` task signals apply (no auth/perf/observability/
migration surface — documentation-only). The repo's WRITE discipline (per-file
`AGENTS.md` row refresh) applies and is captured as a task, not a skill.
