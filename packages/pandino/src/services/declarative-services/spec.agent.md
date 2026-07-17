# spec.agent.md — digest of `packages/pandino/src/services/declarative-services/spec.md`

Formal, testable lifecycle model for Declarative Services (SCR). Authoritative spec behind the SCR implementation and its test suite.

## Gist
- **Dual state machine**: model SCR as two linked machines — **Component Configuration** (potential to activate, governed by dependencies) and **Component Instance** (actual runtime object). The `immediate` attribute links them.
- **Preconditions for activation (SATISFIED)**: (1) component **enabled**; (2) **configuration dependency** satisfied (config gatekeeper, policy require/optional/ignore); (3) **service reference satisfaction** (mandatory cardinalities).
- **Activation (SATISFIED → ACTIVE)**: immediate (`immediate=true`) vs delayed (`immediate=false`) activation; factory components; service scopes (singleton/bundle/prototype).
- **Runtime dynamics in ACTIVE**: static reference policy (component must deactivate to rebind) vs dynamic policy (rebind live); configuration updates (`@Modified`).
- **Component Lifecycle Matrix** enumerates state transitions.
- **Test suite architecture**: recommends structuring SCR tests around the formal model.

## Relevance
- Registration-order-independent activation (#297) is a consequence of "service reference satisfaction" being a precondition re-evaluated as services appear — not tied to registration order.

## When to open the full file
Verifying exact state-transition rules or designing SCR conformance tests.
