# Design: add-osgi-spec-test-coverage

## Approach

Test-first, subsystem by subsystem. For each gap:

1. Write the test asserting the OSGi-specified behavior.
2. Run it. If it passes → behavior already correct, keep the test as a
   regression guard. If it fails → decide: real bug (fix minimally) or
   intentional divergence (delete the test, add a line to the divergences doc).
3. Keep tests colocated with the existing suites and naming (`*.test.ts`,
   `describe`/`it("should …")`), matching current file layout under
   `src/framework/` and `src/services/**/__tests__/`.

## Scope boundary — ported vs not-ported

The audit distinguishes three buckets. Only the first two are actionable:

| Bucket                                        | Action                                  |
| --------------------------------------------- | --------------------------------------- |
| Ported + tested                               | leave as-is                             |
| Ported + untested                             | **add tests** (the bulk of this change) |
| In interface but not implemented / not ported | **document as divergence**, do not test |

Not-ported (divergence doc, no tests): R8 Logger `{}` placeholders,
per-level `isXEnabled()`, `TRACE`/`AUDIT` levels; ServiceTracker
`waitForService`, `remove`, `getTrackingCount`, `getTracked`, `open(boolean)`;
`Bundle.update`.

## The two conformance bugs (TDD red first)

- **Config Admin — `service.pid` / `service.factoryPid` not injected.**
  `configuration-admin.ts` delivers the stored properties object directly to
  `ManagedService.updated` / `ManagedServiceFactory.updated`. Spec 104.4.x
  requires the delivered `Dictionary` to carry `service.pid` (and
  `service.factoryPid` for factories). Fix: merge these automatic props into a
  copy of the properties at delivery time.

- **Event Admin — `Event` properties not defensively copied.**
  `Event` constructor stores the caller's object by reference, so `getProperty`
  reflects post-construction external mutation. Spec 113.3 treats event props as
  immutable. Fix: `this.properties = { ...properties }` in the constructor.
  (`getProperties` already returns a copy — only the ctor leaks.)

Verified NOT a bug during exploration: EventAdmin `a/b/*` matching `a/b/c/d` is
**correct** — OSGi 113.3.1 trailing `/*` matches the prefix and all sub-levels.

## Coverage matrix (SCR)

The cardinality × policy × policy-option grid is the largest gap. Enumerate the
missing cells explicitly in tasks so each `(cardinality, policy, policyOption)`
combination the code supports gets one satisfaction test and one
activation/rebind test. Align state assertions to the project's own
`src/services/declarative-services/spec.md` state machine
(DISABLED / UNSATISFIED_* / SATISFIED / ACTIVE).

## Risks

- A "failing" test may reflect a spec misread rather than a code bug — the
  `doubt-driven-review` skill gates each fix-vs-divergence decision.
- Snapshot tests exist under SCR `__snapshots__`; new tests should avoid
  brittle snapshot coupling unless a snapshot is the clearest assertion.
