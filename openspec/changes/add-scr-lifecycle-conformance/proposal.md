# Proposal: add-scr-lifecycle-conformance

## Why

The `add-osgi-spec-test-coverage` change added tests that documented several
Declarative Services (SCR) behaviors that diverge from the OSGi Compendium 112
lifecycle model — the same model the project already formalizes in
`packages/pandino/src/services/declarative-services/spec.md` (the "Component
Lifecycle Matrix"). These divergences were deliberately left as a backlog
because fixing them reworks the SCR state machine and risks the 167 passing DS
tests. This change closes that gap: make the runtime match its own spec.md.

The failing scenarios are already enumerated in spec.md with stable IDs
(SP-REL-02, SP-GRD-01, SA-DLY-01, SA-DLY-02, CU-NOM-01, DP-ADD-01) and asserted
(as CURRENT/divergent behavior) in
`__tests__/references/reference-matrix.test.ts`. This change flips those
`// DIVERGENCE` assertions to the spec-correct outcome and implements the
behavior to make them pass.

## What Changes

1. **`policyOption` (reluctant vs greedy) becomes behavioral** — currently parsed
   into metadata but never read.
   - `reluctant` (SP-REL-02): a bound static reference IGNORES the arrival of a
     higher-ranked service; stays bound to the original.
   - `greedy` (SP-GRD-01, "Greedy Static Trap"): arrival of a higher-ranked
     service for a static reference forces `unbind → @Deactivate → new instance
     → bind → @Activate`.
2. **Delayed-component lifecycle** (SA-DLY-01/02) — an `immediate:false` provider
   that is SATISFIED registers a service factory and stays INACTIVE; the instance
   is created and `@Activate` invoked on the first `getService(P)`.
3. **"Missing Modified Deactivation"** (CU-NOM-01) — a configuration update to a
   component without an `@Modified` method forces a full `@Deactivate`/`@Activate`
   cycle (new instance), instead of the current no-op.
4. **Dynamic activation double-bind** (DP-ADD-01) — a dynamic reference must
   `bind` each service exactly once during activation; the current two-pass
   `satisfyReferences` binds present services twice. Fixing this requires
   reworking the two-pass binding WITHOUT breaking the circular-dependency
   deadlock path that currently relies on the second pass.

## Non-goals

- No new public API surface. Behavior-only alignment with spec.md.
- No changes outside `declarative-services/` except test assertion flips.
- Does not touch the framework/service-registry/config/event work already
  shipped by `add-osgi-spec-test-coverage`.

## Discipline Skills

- `doubt-driven-review` — each state-machine change (greedy trap, delayed
  activation, config-without-@Modified) is a non-trivial, cross-boundary decision
  with a 167-test blast radius; stress-test before it stands.
- `systematic-debugging` — the double-bind fix already broke the circular-dep
  deadlock test once; root-cause the two-pass/late-binding interaction with
  evidence before re-attempting.
