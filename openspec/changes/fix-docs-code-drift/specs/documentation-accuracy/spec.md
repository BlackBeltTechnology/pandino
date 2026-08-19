# Documentation Accuracy Specification

## Purpose

Published documentation (READMEs, the `docs-site/` VitePress tree, `docs/`
pattern guides, and root docs) MUST describe the code as it actually is. Every
code snippet must import from the module that exports the symbol, and every
documented API signature, option, enum value, and tool name must match source.
Where a doc and the code disagree, the code is authoritative and the doc is
corrected.

## Requirements

### Requirement: Decorators are documented as exports of `@pandino/decorators`

Documentation SHALL import the SCR decorators (`Component`, `Service`,
`Reference`, `Activate`, `Deactivate`, `Modified`, `Property`,
`ConfigurationPolicy`, `Factory`, `Immediate`, `Scope`) from
`@pandino/decorators`, never from `@pandino/pandino`.

#### Scenario: Root README Quick Concept Demo

- WHEN the root `README.md` demo imports SCR decorators
- THEN they SHALL be imported from `@pandino/decorators`
- AND `ComponentContext` SHALL remain a type import from `@pandino/pandino`

### Requirement: Bootstrap snippets use the real framework entry points

Documentation SHALL show bundle bootstrapping via `OSGiBootstrap` and
`BundleContext.installBundle`, and SHALL NOT reference nonexistent symbols
(no default `Pandino` export, no `Pandino` class, no `bundles` bootstrap
option, no `.init()`).

#### Scenario: bundles.md "At Bootstrap" example

- WHEN `docs-site/concepts/bundles.md` shows installing bundles at bootstrap
- THEN it SHALL use `new OSGiBootstrap({ frameworkLogLevel })`, `await start()`,
  `getBundleContext()`, and `context.installBundle(import(...))`

### Requirement: Decorator usage matches decorator signatures

Documented decorator calls SHALL match the source signatures. `@Property` SHALL
be shown with positional `(key, value)` arguments.

#### Scenario: whiteboard-pattern @Property

- WHEN `docs/whiteboard-pattern.md` sets a service property via `@Property`
- THEN it SHALL use `@Property('event.topics', 'user/*')` (positional)

### Requirement: API reference matches exported signatures and enums

The `docs-site/api/*` pages SHALL match the exported signatures, enum members,
and method sets of their source modules.

#### Scenario: core.md Bundle.update, LogLevel, LogService

- WHEN `docs-site/api/core.md` documents `Bundle.update`, `LogLevel`, or
  `LogService`
- THEN `Bundle.update` SHALL read `update(module?: Promise<BundleModule> |
BundleModule): Promise<void>`
- AND `LogLevel` SHALL include `AUDIT = 0` and `TRACE = 5`
- AND `LogService` SHALL document `trace()` and `audit()`

### Requirement: Repo metadata is accurate

Root and package docs SHALL reference the correct package set, working links,
and the actual tooling.

#### Scenario: README package list, license links, tooling

- WHEN the root `README.md` lists packages or links the license badge
- THEN the Packages table SHALL include `@pandino/decorators` and
  `@pandino/rollup-bundle-plugin`
- AND license badges SHALL link to `LICENSE` (not `LICENSE.txt`)
- WHEN `CONTRIBUTING.md` names the formatter
- THEN it SHALL name `oxfmt`, not Biome
