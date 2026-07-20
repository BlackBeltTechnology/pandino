# SCR Lifecycle Conformance Specification

## Purpose

Bring the Declarative Services runtime into conformance with the Component
Lifecycle Matrix in `packages/pandino/src/services/declarative-services/spec.md`
(OSGi Compendium 112). Each requirement maps to a matrix scenario ID and is
verified by flipping the corresponding `// DIVERGENCE` test in
`__tests__/references/reference-matrix.test.ts` to the spec-correct outcome.

## Requirements

### Requirement: Reluctant static references ignore better services (SP-REL-02)

A `static`/`reluctant` reference that is already bound SHALL NOT rebind when a
higher-ranked service is registered.

#### Scenario: Higher-ranked arrival is ignored

- WHEN a component with a `1..1 static reluctant` reference is ACTIVE bound to S1 (rank 5)
- AND a higher-ranked S2 (rank 10) is registered
- THEN the component SHALL remain ACTIVE bound to S1 with no bind/unbind/deactivate

### Requirement: Greedy static trap (SP-GRD-01)

A `static`/`greedy` reference SHALL be fully reactivated when a strictly
higher-ranked service appears.

#### Scenario: Higher-ranked arrival forces reactivation

- WHEN a component with a `1..1 static greedy` reference is ACTIVE bound to S1 (rank 5)
- AND a higher-ranked S2 (rank 10) is registered
- THEN the runtime SHALL invoke `unbind(S1) → @Deactivate → new instance → bind(S2) → @Activate`

#### Scenario: Bound service unregistered (SP-GRD-02)

- WHEN the greedy component's bound service is unregistered
- THEN the component SHALL become UNSATISFIED and invoke `unbind → @Deactivate`

### Requirement: Missing Modified Deactivation (CU-NOM-01)

A configuration update to a component WITHOUT an `@Modified` method SHALL force a
full deactivate/reactivate cycle producing a new instance.

#### Scenario: Config update without @Modified

- WHEN an ACTIVE component with no `@Modified` method has its configuration updated
- THEN the runtime SHALL invoke `@Deactivate` then `@Activate` with a new instance
- AND a component WITH an `@Modified` method SHALL instead update in place (unchanged)

### Requirement: Delayed component activation (SA-DLY-01, SA-DLY-02)

A SATISFIED `immediate:false` provider SHALL register its service while remaining
INACTIVE, and SHALL instantiate + activate on first use.

#### Scenario: Satisfied delayed component is discoverable but inactive (SA-DLY-01)

- WHEN an `immediate:false` provider of service P becomes SATISFIED
- THEN P SHALL be registered (discoverable) with NO instance created and NO `@Activate` called

#### Scenario: First getService triggers activation (SA-DLY-02)

- WHEN another consumer calls `getService(P)` on the SATISFIED/INACTIVE component
- THEN the runtime SHALL create the instance and invoke `bind` + `@Activate`

### Requirement: Dynamic reference binds each service once (DP-ADD-01)

During activation a dynamic reference SHALL invoke `bind` exactly once per
matching service. The fix SHALL NOT regress the circular-dependency deadlock
handling in `deadlock-scenarios.test.ts`.

#### Scenario: Two services present at activation

- WHEN a `0..n dynamic` component activates with two matching services present
- THEN `bind` SHALL be called exactly twice (once per service), not four times

#### Scenario: Circular dynamic dependencies still resolve

- WHEN two components each hold a `1..1 dynamic` reference to the other
- THEN both SHALL still bind each other without deadlock
