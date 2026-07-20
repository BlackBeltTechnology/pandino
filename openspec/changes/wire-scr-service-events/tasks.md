# Tasks: wire-scr-service-events

TDD throughout. After each group run `pnpm test src/services/declarative-services`
and keep the full suite (691 baseline) green. `doubt-driven-review` before the
integration wiring stands.

## 1. Serialized event queue + translation (unit-tested in isolation)

- [x] RED: with a fake context that emits synchronously, a `serviceChanged` whose reaction re-emits must NOT re-enter (assert single-consumer FIFO)
- [x] Add `handleServiceEvent(event)` to `ServiceComponentRuntime`: map type → registered/modified/unregistered, `objectClass` → interface(s), call `processServiceEvent` per interface
- [x] Add a `draining` flag + queue drainer; `serviceChanged` enqueues + kicks drain; re-entrant emits enqueue only
- [x] Wrap each drain step in try/catch + log (error isolation)
- [x] Verify: serialization + FIFO + error-isolation unit tests green

## 2. Activator wiring

- [x] `ServiceComponentRuntimeBundleActivator implements ... ServiceListener`; `context.addServiceListener(this)` in `start`, `removeServiceListener` in `stop`
- [x] `serviceChanged` delegates to the SCR queue; `stop` abandons the queue
- [x] Verify: activator start/stop adds/removes the listener; no leak

## 3. Reconcile with bundle-event activation (no double work)

- [x] Add an "already active" fast-exit to `activateComponent` (singleton instance set → return)
- [x] RED: a component activated via bundle-event, then its dependency service (re)registers → bound exactly once (no double bind)
- [x] Verify: existing integration tests (bundle/factory/scope) still green

## 4. Runtime dynamic behavior (integration, real framework)

- [x] RED: register a service AFTER a dynamic-reference component is active → component binds it
- [x] RED: unregister a bound dynamic service → component unbinds
- [x] RED: greedy higher-ranked arrival at runtime → reactivation (SP-GRD-01 live)
- [x] RED: mandatory service loss with no survivor → deactivation (SP-GRD-02 live)
- [x] Verify: the previously-dormant SP-REL-02 / SP-GRD-01/02 behaviors now observable through the real framework

## 5. Complete follow-up #4 (survivor rebind) — now that serviceRef is guaranteed

- [x] Re-add the mandatory-survivor branch in `processServiceEvent`, GATED on `serviceRef` being defined (so direct callers without a ref are unaffected)
- [x] static → deactivate + reactivate onto survivor; dynamic 1..1 → rebind in place
- [x] RED: static + dynamic survivor tests (from the reverted attempt) restored and green
- [x] Verify: the existing `component-registration.test.ts` lifecycle test (calls `processServiceEvent` with no ref) STILL green

## 6. Observability + close-out

- [x] Emit an `scr/service-event/delivered` (or similar) trace so event delivery is diagnosable in a running framework
- [x] `doubt-driven-review` on the queue/re-entrancy model and the activation-overlap dedup
- [x] Full `pnpm test` green + `tsc --noEmit` clean
- [x] Mark `add-scr-lifecycle-conformance` follow-ups #6 and #4 as resolved by this change
