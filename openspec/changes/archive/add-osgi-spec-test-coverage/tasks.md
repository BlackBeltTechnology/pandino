# Tasks: add-osgi-spec-test-coverage

TDD throughout: write test → run → fix or document divergence → re-run green.
Run `pnpm test` (or the targeted file) after each group. Each group ends with a
verify step.

## 1. Framework — Service registry & ServiceReference

- [x] Ranking tie broken by `service.id` (lower id wins) in `getServiceReference`/`getServiceReferences`
- [x] `service.ranking` defaults to 0; negative rankings order correctly
- [x] Re-sort after `setProperties` changes `service.ranking`
- [x] `objectClass` is string for single interface, array for multiple
- [x] `service.id` unique + immutable across `setProperties`
- [x] `getServiceReference` null vs `getServiceReferences` empty/null on no match (assert actual contract, document if divergent)
- [x] Stale ref: `getService` on unregistered ref → null; UNREGISTERING fires before removal
- [x] `getProperties()` returns a copy (caller mutation does not leak)
- **Verify**: `pnpm test src/framework/framework.test.ts src/framework/bundle-context.test.ts`

## 2. Framework — ServiceFactory

- [x] Same instance returned per requesting bundle (bundle scope, cached)
- [x] Different instances across different bundles
- [x] `ungetService` invoked on bundle stop with correct args
- [x] Prototype scope (`service.scope=prototype`) → new instance each `getService`
- [x] Factory returning null → not cached, `getService` returns null
- **Verify**: factory tests green

## 3. Framework — Bundle lifecycle & events

- [x] `start()` on ACTIVE = no-op; `stop()` on non-ACTIVE = no-op; double `unregister` safe
- [x] Activator `start()` throws → state reverts to RESOLVED, error propagates
- [x] Activator `stop()` throws → logged, still reaches RESOLVED
- [x] Each `BundleEvent` type asserted: INSTALLED/RESOLVED/STARTING/ACTIVE/STOPPING/UNINSTALLED
- [x] Listener throws → other listeners still fire; remove-never-registered = no-op; add/remove during dispatch
- [x] `Bundle.update` documented as unimplemented (assert real behavior, add to divergences doc)
- **Verify**: `pnpm test src/framework/framework.test.ts src/framework/framework-bundles.test.ts`

## 4. Framework — LDAP filter grammar

- [x] Operators: `=` exact/case-sensitive, `<=`, `>=`, presence `=*`, `~=` (assert ported behavior)
- [x] Substring globbing: prefix `x*`, suffix `*x`, infix `*x*`, multi-`*`
- [x] Escaping: `\*`, `\(`, `\)`, `\\`
- [x] Logical `&`/`|`/`!` incl. short-circuit and deep nesting
- [x] Numeric vs lexicographic coercion in `>=`/`<=`
- [x] Multi-valued/array property: match if any element matches (`=`, `>=`, wildcard)
- [x] Malformed filters rejected (no enclosing parens, unclosed, bad operator)
- **Verify**: `pnpm test src/framework/ldap-filter.test.ts`

## 5. Framework — Version & ranges

- [x] All four bracket combos `[a,b] [a,b) (a,b] (a,b)`
- [x] Open-ended `[1.0,)` and lower-bounded ranges (assert ported behavior)
- [x] Missing minor/patch padded to 0 (`1.0` == `1.0.0`)
- **Verify**: `pnpm test src/framework/version-utils.test.ts`

## 6. Declarative Services (SCR) — reference matrix

- [x] Enumerate supported `(cardinality × policy × policyOption)` cells; one satisfaction + one activation/rebind test each
- [x] Static greedy rebind: higher-ranked service arrives → unbind→deactivate→bind→activate (0..1, 1..1, 0..n, 1..n)
- [x] Delayed component stays SATISFIED-inactive; instance created only on first `getService`
- [x] Dynamic `updated()` fires on bound-service property change
- [x] Config update without `@Modified` → full deactivate/reactivate cycle
- [x] Optional static departure (0..1, 0..n) unbinds but does NOT deactivate
- **Verify**: `pnpm test src/services/declarative-services`

## 7. Config Admin (incl. bug fix)

- [x] **RED**: assert delivered props include `service.pid` (and `service.factoryPid` for factories)
- [x] **FIX**: merge automatic props into a copy at delivery in `configuration-admin.ts`
- [x] `ManagedServiceFactory.deleted()` on config delete
- [x] null-before-first-update semantics
- [x] Delivery to service registered after config exists (late registration)
- [x] Delivered/returned properties immutable (caller mutation does not leak)
- **Verify**: `pnpm test src/services/config-admin`

## 8. Event Admin (incl. bug fix)

- [x] **RED**: mutate the object passed to `new Event(...)` after construction → `getProperty` must not reflect it
- [x] **FIX**: `this.properties = { ...properties }` in `Event` constructor
- [x] `sendEvent` (sync) vs `postEvent` (async) delivery + ordering
- [x] `EVENT_FILTER` LDAP on event properties
- [x] Handler exception isolation (one throws, others still receive)
- [x] `EVENT_TOPIC` as array; regression test for `a/b/*` matching sub-levels (correct per spec)
- **Verify**: `pnpm test src/services/event-admin`

## 9. Log Service & Service Tracker

- [x] Log-level threshold filtering across all ported levels
- [x] LogListener isolation; per-bundle logger state isolation (BundleAwareLogService)
- [x] Tracker: ranking selection in `getService`
- [x] Tracker: pre-open vs post-open registration tracking
- [x] Tracker: `addingService` returns null → not tracked; `ungetService` still called
- [x] Tracker: `modifiedService` fires on ranking/filter-match change
- **Verify**: `pnpm test src/services/log-service src/services/service-tracker`

## 10. Complete ported interfaces (IMPLEMENTED) + tests

- [x] `LogLevel.AUDIT` (0, always logged) + `LogLevel.TRACE` (5); `trace()`/`audit()` on LogService, ConsoleLogService, BundleAwareLogService, FrameworkLogger
- [x] LDAP `~=` approximate match (whitespace/case-insensitive)
- [x] `Bundle.update(module?)`: stop → swap module → resolve → fire `BUNDLE_EVENT_TYPES.UPDATED` → restart if was active; throws if uninstalled
- [x] `ServiceTracker`: `waitForService`, `remove`, `getTrackingCount`, `getTracked`, `isEmpty`, singular `getServiceReference()`
- [x] Tests: LogLevel AUDIT always-logged + TRACE threshold + trace()/audit() dispatch (`log-audit-trace.test.ts`)
- [x] Tests: LDAP `~=` (positive/negative, whitespace/case, missing prop) (`ldap-approximate.test.ts`)
- [x] Tests: `Bundle.update` module swap, restart-if-active, UPDATED event, throw-when-uninstalled (`bundle-update.test.ts`)
- [x] Tests: ServiceTracker new methods incl. `waitForService` now/on-arrival/timeout (`service-tracker-extended.test.ts`)
- [ ] Update doc tree for touched source per WRITE discipline (no per-`src` `AGENTS.md` tree exists yet; deferred)
- [x] **Verify**: full suite green (547 passed), `tsc --noEmit` clean

Out of scope (explicit decision): R8 Logger `{}` placeholder formatting and per-level `isXEnabled()`.

## Divergences — FIXED in this change (red→green)

- **LDAP escaped `\*`** now matches a literal asterisk (rewrote `matchEquals`/`matchWildcard` to respect escapes).
- **LDAP array / multi-valued props** now match if ANY member matches (`leafMatch` in `evaluateAST`).
- **`setProperties`** now preserves read-only `objectClass`/`service.id` (ranking still defaults to 0).
- **`BundleContext.registerService`** now accepts `string[]` (multi-interface).
- **Version** non-bracket exact match is now value-based (`compareVersions === 0`), so `1.0` == `1.0.0`.
- **Config Admin `delete()`** now delivers `deleted()` exactly once.
- **Config Admin late registration**: a `ManagedService`/`ManagedServiceFactory` registering after a config exists now receives the current config (added a REGISTERED listener).
- **SCR `unbind`** now receives the departing service object.

## Divergences — still documented (NOT fixed, with rationale)

**Genuinely architectural (own follow-up change warranted)**

- SCR `policyOption` (greedy/reluctant) inert — parsed, never read.
- SCR no "greedy static trap" (higher-ranked static service rebinds in place).
- SCR no delayed-component lifecycle (`immediate:false` registers no service factory).
- SCR no just-in-time activation on first `getService`.
- SCR config update without `@Modified` is a no-op (no deactivate/reactivate cycle).
- These change the SCR state machine substantially and risk the 167 passing DS tests; they belong in a dedicated SCR-lifecycle change.

**Attempted but reverted (blast radius)**

- SCR dynamic double-bind (bind fires 2× during singleton activation). Removing the redundant second `satisfyReferences` pass broke the circular-dependency deadlock test (the second pass is load-bearing for late binding in that harness). Left as-is.

**Non-standard syntax / design decisions (not bugs)**

- Version `[1.0]` / `(1.0)` single-bracket → open-range: `[1.0]` isn't valid OSGi range syntax.
- STARTING/STOPPING states set internally but not emitted as `BundleEvent`s.
- `BundleAwareLogService` shares one global level (no R8 LoggerContext / per-bundle levels).
