# Design: add-scr-lifecycle-conformance

## Approach

Test-first, one spec.md scenario at a time. For each: flip the corresponding
`// DIVERGENCE` assertion in `reference-matrix.test.ts` to the spec-correct
outcome (RED), implement the minimal SCR change (GREEN), then run the FULL DS
suite (currently 167) to catch regressions before moving on. Because these
changes are entangled, order matters — do the least-coupled first.

## Recommended order (least → most entangled)

1. **`policyOption` reluctant (SP-REL-02)** — lowest risk. In
   `processServiceEvent('registered')`, before binding a NEW service to an
   already-satisfied STATIC reference, check policy/policyOption: a `reluctant`
   (default) static reference must NOT rebind on a new arrival. This alone fixes
   the "both rebind in place" divergence for reluctant.

2. **Greedy static trap (SP-GRD-01)** — when a higher-ranked service arrives for
   a `static`/`greedy` reference, compare ranking against the currently bound
   service; if strictly higher, drive the full cycle:
   `unbind(old) → @Deactivate → recreate instance → bind(new) → @Activate`. Needs
   access to the currently bound service's ranking (track it on the component
   entry at bind time).

3. **Config without `@Modified` (CU-NOM-01)** — in `updateComponentConfiguration`,
   when the component has no `@Modified` method, perform
   `deactivateComponent` + `activateComponent` (new instance) instead of the
   current event-only no-op.

4. **Delayed components (SA-DLY-01/02)** — the largest change. A SATISFIED
   `immediate:false` provider must register a delayed service factory so the
   service is discoverable while INACTIVE; the factory's `getService` triggers
   instantiation + `@Activate` on first request. This touches the
   register/activate split in `scr.ts` (the `serviceRegistration` vs `instance`
   duality already hinted at around the "delayed activation" comments).

5. **Dynamic double-bind (DP-ADD-01)** — do LAST, because it is the one that
   already regressed. The second `satisfyReferences` pass after `@Activate` is
   load-bearing for the circular-dependency deadlock test
   (`deadlock-scenarios.test.ts`). The fix must make binding idempotent per
   (reference, service) WITHOUT dropping the late-binding the deadlock test needs
   — e.g. track bound service identities on the component entry and skip
   re-binding already-bound services, rather than deleting the second pass.

## Key risk: the double-bind / deadlock coupling

`systematic-debugging` first. Evidence to gather before touching it:

- Exactly how the circular A↔B (1..1 dynamic each) test binds today — via the
  second pass, via `processServiceEvent`, or both.
- Whether an idempotent bound-set makes the second pass a no-op for present
  services while still letting the deadlock test's late bind occur.

If an idempotent bound-set cannot satisfy both, escalate: the deadlock test may
itself encode non-spec behavior and need revisiting.

## Test strategy

- Flip assertions in `reference-matrix.test.ts` scenario by scenario; keep the
  scenario-ID comments (SP-REL-02 etc.) but change the note from DIVERGENCE to
  the spec citation.
- After each scenario: `pnpm test src/services/declarative-services` must stay
  green (except the one under construction, briefly RED).
- Final gate: full `pnpm test` + `tsc --noEmit` clean.

## Out of scope

- `unbind` argument passing — already fixed in `add-osgi-spec-test-coverage`.
- Framework/LDAP/Version/Config/Event divergences — already fixed there.
