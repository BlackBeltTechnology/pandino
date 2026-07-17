# CHANGELOG.agent.md — digest of `CHANGELOG.md`

Release notes, Conventional-Commits style. Read the full file for exact version diffs.

## Gist

- **0.9.22 (2025-08-01)** is a complete framework rewrite — the current baseline of features.
- Headline areas: core framework rewrite; service registry & discovery (LDAP filters, ranking, safe references); bundle system (activators, dynamic load, dependency resolution); advanced service management.
- **Declarative Services (SCR)**: `@Component`, `@Service`, `@Reference`, `@Activate`/`@Deactivate`; automatic dependency injection + lifecycle.
- **Built-in enterprise services**: EventAdmin, Configuration Admin, Log Service, Service Tracker.
- **React integration** (`@pandino/react-hooks`): Provider component + hooks.
- Includes Migration Guide (breaking changes), package/install info, requirements, TypeScript/config setup.

## When to open the full file

Confirming when a specific feature/behavior landed, or exact breaking-change wording.
