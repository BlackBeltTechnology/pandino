# Dependency Security Baseline

## ADDED Requirements

### Requirement: No dependency below its advisory patched version

The resolved `pnpm-lock.yaml` SHALL NOT contain any version of a package that
falls within a published GitHub/OSV advisory's affected range when a patched
version exists. Development- and build-time dependencies are in scope; a
dependency MAY be pinned via `pnpm.overrides` when the fix is only reachable
transitively.

#### Scenario: Flagged transitive leaf is pinned to its patched version

- WHEN a Dependabot alert flags a transitive package (e.g. `qs`, `postcss`,
  `fast-uri`, `brace-expansion`) below its patched version
- THEN a `pnpm.overrides` entry SHALL pin it to the patched version
- AND `pnpm-lock.yaml` SHALL resolve only that patched version

#### Scenario: A vulnerable version reachable only via a parent is removed

- WHEN a vulnerable version (e.g. `vite@5.4.21`, `esbuild@0.21.5`) exists only
  because a parent dependency pins it, and no patch exists on that major line
- THEN the parent (e.g. `vitepress`) SHALL be upgraded to a release whose
  dependency range excludes the vulnerable version
- AND the vulnerable version SHALL be absent from `pnpm-lock.yaml`

#### Scenario: Full verification confirms every alert is cleared

- WHEN all upgrades and overrides are applied and `pnpm install` has run
- THEN each alerted package's resolved version SHALL be at or above its
  advisory's patched boundary
- AND `pnpm test` and `pnpm build` SHALL pass
- AND `pnpm docs:build` SHALL succeed on the upgraded docs toolchain
