# Proposal: wire-scr-service-events

## Why

The `add-scr-lifecycle-conformance` change made the SCR reference state machine
(`ServiceComponentRuntime.processServiceEvent`) spec-correct for reluctant/greedy
static policy, mandatory-loss deactivation, config reactivation, and idempotent
dynamic binding. But an adversarial review found that **`processServiceEvent` has
no production caller** — the SCR bundle activator subscribes to _bundle_ events
(`addBundleListener`) but never to _service_ events (`addServiceListener`). So
all of that conformance is **dormant at runtime**: a service registering,
modifying, or unregistering after a component is active never reaches the SCR.

This change wires the framework's service events into the SCR so the dynamic
behaviors actually run, and does so **without re-entrancy hazards**. The naive
wiring is dangerous: the framework emits service events **synchronously**, so an
SCR reaction that (de)activates a component — which registers/unregisters that
component's own provided service — would re-enter `processServiceEvent` in the
middle of an in-progress activation. It also completes follow-up **#4**
(mandatory reference rebinding onto a survivor), which was blocked purely because
callers could omit the departing `serviceRef`.

## What Changes

1. **Serialized service-event delivery.** The SCR activator registers a
   `ServiceListener`; each `ServiceEvent` is translated (type → `registered` /
   `modified` / `unregistered`; `objectClass` → interface name(s)) and enqueued.
   A single async worker drains the queue **one event at a time**, so a reaction
   that emits further service events enqueues them rather than re-entering.
2. **Re-entrancy safety.** Events emitted by the SCR's own (de)activation are
   handled through the same queue (never synchronously nested). No event is
   silently dropped and no unbounded recursion occurs.
3. **Reconcile with bundle-event activation.** The existing bundle-event path
   (`processBundle` on ACTIVE) still discovers/activates components; the new
   service-event path must not double-bind or double-activate — dedup via the
   existing idempotent bind-sets (`boundServiceRefs` / `boundMultiServices`) and
   the `activationChain` guard.
4. **Complete #4.** With a guaranteed concrete departing `serviceRef`, a
   mandatory reference losing its bound service while a survivor exists rebinds
   (dynamic 1..1) or reactivates (static) onto the survivor.

## Non-goals

- No change to the SCR reference-resolution semantics already shipped (only how
  events reach them).
- Delayed-component lazy activation (SA-DLY) remains out of scope — that is a
  separate sync-`getService`/async-activation problem.
- No new public API.

## Discipline Skills

- `doubt-driven-review` — synchronous event emission + re-entrant (de)activation
  is a high-blast-radius runtime change; stress-test the queue/re-entrancy model
  before it stands.
- `systematic-debugging` — re-entrancy, event ordering, and double-activation
  bugs are likely; require evidence (event traces) before fixes.
- `observability-instrumentation` — the SCR already publishes `scr/component/*`
  events; add event-delivery tracing so "did this service event reach the SCR"
  is answerable in a running framework.
