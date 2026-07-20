# Design: wire-scr-service-events

## The core problem: synchronous emission + re-entrant activation

`OSGiFramework` emits service events synchronously: `registerService` /
`unregister` call `this.emit('service-event', event)`, which invokes every
`ServiceListener.serviceChanged` inline. The SCR's reactions
(`activateComponent` / `deactivateComponent`) register or unregister the
component's own provided service → another synchronous emit → nested
`serviceChanged`. Naively calling `processServiceEvent` from `serviceChanged`
therefore re-enters mid-activation, corrupting the `activationChain` and
producing double-binds or lost events. A guard that just drops nested events
loses legitimate cross-component bindings.

## Solution: a single-consumer async event queue

```
framework.emit('service-event')           SCR activator
        │ (synchronous)                    ┌───────────────────────────┐
        ▼                                  │ serviceChanged(event):     │
  ServiceListener.serviceChanged  ───────▶ │   queue.push(event)        │
                                           │   if (!draining) drain()   │
                                           └───────────┬───────────────┘
                                                       ▼
                                           drain(): while queue not empty
                                             ev = queue.shift()
                                             await scr.handleServiceEvent(ev)   ← may emit more
                                                                                  events, which just
                                                                                  enqueue (draining=true)
```

- `serviceChanged` is synchronous and cheap: translate + enqueue + kick the
  drainer. It never blocks the framework's `registerService`.
- `drain()` is a single async loop guarded by a `draining` flag. Re-entrant
  emits (from `handleServiceEvent`'s own (de)activation) enqueue and are picked
  up by the already-running loop — never nested, never dropped.
- Ordering is FIFO, matching OSGi's "events delivered in order" expectation.

## Translation

`handleServiceEvent(event)`:
- type: `SERVICE_EVENT_TYPES.REGISTERED(1)` → `registered`,
  `MODIFIED(2)` → `modified`, `UNREGISTERING(4)` → `unregistered`.
- interfaces: read `objectClass` (string or string[]); call
  `processServiceEvent(iface, type, ref)` for each — `processServiceEvent`
  already matches `ref.interface === iface`.

## Reconciling with bundle-event activation (no double work)

Today `processBundle` (bundle ACTIVE) discovers components and activates
immediate ones; `processServiceEvent('registered')` also calls
`checkPendingImmediateComponents`. Both can activate the same component. Guards:
- `activationChain` already prevents re-entrant activation of the same component.
- The idempotent `boundServiceRefs` / `boundMultiServices` sets (shipped in the
  prior change) prevent double-binding a service already bound at activation.
- Add an "already active" fast-exit to `activateComponent` (if `entry.instance`
  is set and not a factory scope, return) to avoid re-instantiation from an
  overlapping trigger.

## Completing #4 (survivor rebind) — now safe

With the queue, `processServiceEvent('unregistered', ref)` always carries the
concrete departing `serviceRef`. In the mandatory-loss branch, when
`remaining = getServiceReferences(iface).filter(r => r !== serviceRef)` is
non-empty:
- static → `deactivate` + `activate` (reactivate onto best survivor);
- dynamic 1..1 → `bind(getService(remaining[0]))` in place + update
  `boundServiceRefs`.
The earlier attempt broke an existing test only because a caller passed no
`serviceRef`; the real event pipeline always provides one, and that test drives
`processServiceEvent` directly (it can keep doing so — the survivor branch is
gated on `serviceRef` being defined).

## Risks & mitigations

- **Infinite reactivation loop** (greedy: ever-higher-ranked service): bounded
  in practice (ranking is finite); add a per-drain visited guard if needed.
- **Event storms at startup**: many services register as bundles start; the
  queue serializes them — acceptable, but measure.
- **Async worker error isolation**: a throwing `handleServiceEvent` must not kill
  the drainer — wrap each drain step in try/catch + log.
- **Framework teardown**: `stop()` must `removeServiceListener` and abandon the
  queue.

## Test strategy

- Unit: a fake framework that emits synchronously into the listener; assert
  serialization (a reaction that re-registers does not re-enter), FIFO order,
  and error isolation.
- Integration: real `OSGiFramework` + SCR activator; register a service after a
  component is active → the component binds; unregister → unbind/reactivate;
  greedy higher-rank arrival → reactivation.
- Regression: full suite (691) stays green; the dormant-path unit tests in
  `reference-matrix.test.ts` keep passing.
