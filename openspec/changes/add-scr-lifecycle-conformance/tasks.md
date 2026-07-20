# Tasks: add-scr-lifecycle-conformance

TDD, one spec.md scenario at a time. After EACH group, run
`pnpm test src/services/declarative-services` and keep it green (except the
scenario briefly under construction). Reference: the Component Lifecycle Matrix
in `packages/pandino/src/services/declarative-services/spec.md`.

## 1. policyOption = reluctant (SP-REL-02) — DONE

- [x] RED: flipped the `reluctant` half — a static reluctant reference must IGNORE a newly-arrived service
- [x] Read `ref.policy`/`ref.policyOption` in `processServiceEvent('registered')`; skip in-place rebind for static reluctant
- [x] Verify: SP-REL-02 green; greedy still rebinds in place (flip in group 2); full suite 688 green

## 2. Greedy static trap (SP-GRD-01, SP-GRD-02) — DONE

- [x] Track the currently-bound service ref on `ComponentEntry.boundServiceRefs` at bind time
- [x] RED: greedy static trap test with ranked refs — higher-ranked arrival forces `unbind(old) → @Deactivate → new instance → bind(new) → @Activate`
- [x] Implement the reactivation cycle for `static`/`greedy` on a strictly-higher-ranked arrival
- [x] SP-GRD-02: mandatory static ref losing its service (no replacement) now deactivates (SP-REL-01 too)
- [x] Verify: greedy scenarios green; DS 168, full suite 689 green

## 3. Missing Modified Deactivation (CU-NOM-01) — DONE

- [x] RED: flipped the test to expect a full deactivate/reactivate with a NEW instance
- [x] In `updateComponentConfiguration`: no `@Modified` → `deactivateComponent` + `activateComponent`
- [x] Verify: `@Modified` path still updates in place; no-`@Modified` path reactivates; DS 168, full 689 green

## 4. Delayed components (SA-DLY-01, SA-DLY-02) — BLOCKED (architectural)

- [ ] BLOCKED: lazy activation on first `getService` collides with the framework's SYNCHRONOUS `getService`/`ServiceFactory.getService` contract, while component activation (`satisfyReferences`, `@Activate`) is ASYNC. Returning a fully-activated instance through a sync factory is not possible without making `getService` async (large framework-wide change) or restricting `@Activate`/bind to synchronous only. Deferred to its own design effort.
- Rationale recorded; the two SA-DLY tests remain as DIVERGENCE (documenting current eager behavior).

## 5. Dynamic activation double-bind (DP-ADD-01) — DONE

- [x] `systematic-debugging`: the double-bind is in the 0..n/1..n path; the deadlock test uses 1..1 (first branch), so it is untouched by a multi-cardinality fix
- [x] Added idempotent per-(reference, service) bound-set (`ComponentEntry.boundMultiServices`), cleared on deactivate
- [x] RED: flipped "0..n dynamic greedy binds every matching service" from `bound.length === 4` to `=== 2`
- [x] `satisfyReference` multi-branch skips already-bound services; second pass kept, so the deadlock test's 1..1 late bind still occurs
- [x] Verify: `deadlock-scenarios.test.ts` STILL green AND double-bind gone; DS 168, full 689 green

## 6. Close-out

- [x] Full `pnpm test` green (689) + `tsc --noEmit` clean
- [ ] `doubt-driven-review` on the greedy-trap + config-reactivate + double-bind changes before commit
- [ ] Group 4 (delayed components) remains open as a separate design effort (sync getService vs async activation)

## 7. Doubt-driven review — DONE

Fresh-context adversarial review of the state-machine changes (cross-model
skipped — offer declined). 7 findings, 4 actionable; fixed:

- [x] #1 (LIVE): `fieldOption:'update'` double-appended on the 2nd activation pass — now appends only newly-bound services (regression test added)
- [x] #2 (LIVE): two same-interface references with no `name` collided on `refKey` (under-binding) — `refKey` is now `ref.name || ref.bind || ref.field || ref.interface` (regression test added)
- [x] #3: greedy reactivation now `break`s (was `continue`) so no stale-instance use across a second same-interface ref
- [x] #5: unregister now removes the departed service/ref from the bound-sets (prevents suppressed re-bind / dead-ref ranking reads)
- Verified: full suite 691 green, tsc clean

### Follow-ups (not implemented — out of scope)

- **#6 (important): `processServiceEvent` has NO production caller** — the SCR is not subscribed to framework service events, so SP-REL-02 / SP-GRD-01 / SP-GRD-02 (and the unregister deactivation) are spec-correct at the SCR API level but DORMANT at runtime. Wiring the event pipeline is its own change.
- **#4**: a mandatory reference losing its service while a survivor exists should rebind/reactivate onto the survivor (static) or rebind to the next (dynamic). ATTEMPTED and REVERTED: the survivor logic needs the departing service reference to be reliably identified, but callers may invoke `processServiceEvent` without a `serviceRef` (an existing lifecycle test does), so a still-registered service was wrongly treated as a survivor and reactivated. Belongs with the #6 event-pipeline wiring, which guarantees a concrete departing `serviceRef`.

## Status

5 of 6 scenario groups done (SP-REL-02, SP-GRD-01, SP-GRD-02, CU-NOM-01,
DP-ADD-01) + doubt-review hardening. Group 4 (SA-DLY delayed components) blocked
on the sync/async getService architecture. Two runtime-wiring follow-ups (#6, #4)
noted above.
