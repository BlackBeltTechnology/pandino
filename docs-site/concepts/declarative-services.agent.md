# declarative-services.agent.md — digest of `docs-site/concepts/declarative-services.md`

Conceptual guide to SCR (Service Component Runtime), Pandino's decorator-based DI.

## Gist
- **Lifecycle**: `UNSATISFIED → ACTIVATING → ACTIVE → DEACTIVATING → UNSATISFIED`, driven by dependency satisfaction. **Activation is registration-order independent** — a component activates as soon as its mandatory `@Reference`s are available, even if providers register later (see change: #297).
- **`@Component`**: name, `immediate`, factory, etc.
- **`@Service`**: interfaces (+ scope) the component is registered under.
- **`@Reference`**: dependency injection. Options: cardinality (`0..1`/`1..1`/`0..n`/`1..n`), target LDAP filter, policy (`static`/`dynamic`), policyOption (`reluctant`/`greedy`), field vs bind/unbind.
- **Lifecycle callbacks**: `@Activate`/`@Deactivate`/`@Modified`; `ComponentContext`.
- **Configuration policies**: optional/require/ignore. **Service scopes**: singleton/bundle/prototype. **Factory components**.
- **Loading**: bundle `components` array, Rollup auto-discovery, or programmatic `scr.registerComponent`.

## When to open the full file
Exact decorator option semantics or code examples.
