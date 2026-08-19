# Proposal: add-osgi-spec-test-coverage

## Why

Pandino ports a subset of the OSGi Core R8 + Compendium R8 APIs and already
carries 518 test cases across six subsystems. An audit against the official
specs — scoped strictly to _what is actually ported_ — found meaningful,
behavior-supported gaps plus two latent spec-conformance bugs. Closing these
raises confidence that the port behaves like a real OSGi container on the
surface it claims to implement.

## What Changes

Add the missing spec-grounded test cases (only for ported behavior) and fix the
two conformance bugs the new tests expose, following TDD (red → green):

1. **Framework — service registry & lifecycle**: ranking ties broken by
   `service.id`, default/negative ranking, re-sort after `setProperties`, stale
   references after `unregister`, `ServiceFactory` per-bundle caching /
   prototype scope / `ungetService` on stop, idempotent `start`/`stop`, activator
   failure rollback, full `BundleEvent` type coverage, listener-throw isolation.
2. **Framework — LDAP filter grammar**: exhaustive operator matrix (`=`, `<=`,
   `>=`, `~=`, presence `=*`, substring globbing, `&`/`|`/`!`, nesting,
   escaping, numeric-vs-lexicographic coercion, multi-valued/array props,
   attribute-name case sensitivity, malformed-filter rejection).
3. **Framework — Version**: all four range bracket combos, open-ended ranges,
   minor/patch padding.
4. **Declarative Services (SCR)**: fill the cardinality × policy × policy-option
   matrix — static greedy rebind ("greedy static trap"), delayed-component
   activation on first `getService`, dynamic `updated()`, config update without
   `@Modified` → deactivate/reactivate, optional static departure semantics.
5. **Config Admin**: `ManagedServiceFactory.deleted()`, null-before-first-update,
   late-registration delivery, properties immutability, delete propagation.
   **Bug fix**: inject `service.pid` / `service.factoryPid` into delivered
   properties (spec 104.4.x).
6. **Event Admin**: `sendEvent` (sync) vs `postEvent` (async) ordering,
   `EVENT_FILTER` on props, handler-exception isolation, `EVENT_TOPIC` array.
   **Bug fix**: defensively copy properties in the `Event` constructor.
7. **Log Service & Service Tracker**: log-level threshold matrix, listener
   isolation, per-bundle logger state isolation; tracker ranking selection,
   pre/post-open tracking, `addingService`-returns-null suppression,
   `modifiedService` on ranking/filter change, `ungetService` cleanup.
8. **Complete the ported interfaces** (implemented in this change — no
   divergences left undone): `LogLevel.AUDIT`/`LogLevel.TRACE` + `trace()` /
   `audit()` on `LogService` (AUDIT always logged); `ServiceTracker`
   `waitForService`, `remove`, `getTrackingCount`, `getTracked`, `isEmpty`,
   singular `getServiceReference()`; LDAP `~=`
   approximate match; `Bundle.update(module?)` (stop → swap module → restart,
   fires `UPDATED`). Then add tests for each.
   Out of scope by explicit decision: R8 Logger `{}` placeholder formatting and
   per-level `isXEnabled()` (the port keeps the simplified `LogService` +
   `isLoggable(level)` shape).

## Non-goals

- No new runtime features. Tests + two minimal conformance fixes only.
- No tests for OSGi features Pandino has not ported.
- No change to public API shape.

## Discipline Skills

- `systematic-debugging` — the Config Admin `service.pid` injection and the
  Event Admin property-copy bugs surface as failing red tests; root-cause before
  patching.
- `doubt-driven-review` — before locking in the "intentional divergence" list,
  confirm each item is a deliberate port boundary rather than a missed feature.
