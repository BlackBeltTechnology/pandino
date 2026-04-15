# @pandino/example

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

A small React + Vite application that demonstrates how all Pandino packages fit together in a real build. **This package is not published to npm** — it exists as living documentation and a reference setup for consumer developers.

## What it demonstrates

- Bootstrapping Pandino inside a React app with [`@pandino/react-hooks`](../react-hooks/README.md) (`<PandinoProvider>`).
- Declaring service components with [`@pandino/decorators`](../decorators/README.md) (`@Component`, `@Service`, `@Reference`, `@Activate`, `@Deactivate`).
- Packaging components into bundles at build time with [`@pandino/rollup-bundle-plugin`](../rollup-bundle-plugin/README.md) (two separate bundles, `alpha` and `beta`).
- Writing a bundle activator that consumes the built-in `LogService` from [`@pandino/pandino`](../pandino/README.md).
- Consuming those services from React components via `useService` and friends.
- Wiring everything up with Vite, React Router, and Material-UI.

## Where it fits in the Pandino ecosystem

```
@pandino/decorators  ──┐
                       ├─▶ @pandino/rollup-bundle-plugin ──▶ virtual bundle modules
src/bundles/alpha/*  ──┤                                        │
src/bundles/beta/*   ──┘                                        │
                                                                ▼
                                                     <PandinoProvider bundles={...}>
                                                                │
                                                                ▼
                                                     @pandino/pandino runtime
                                                                │
                                                                ▼
                                                        React components
                                                        (useService, ...)
```

## Repository layout

| Path                               | What to look at                                                        |
| ---------------------------------- | ---------------------------------------------------------------------- |
| [`vite.config.ts`](./vite.config.ts) | Two `pandinoBundle()` calls producing `pandino:bundle:alpha` and `pandino:bundle:beta`. |
| [`src/main.tsx`](./src/main.tsx)     | Root render wrapped in `<PandinoProvider bundles={[...]} />`.        |
| [`src/bundles/alpha/activator.ts`](./src/bundles/alpha/activator.ts) | A classic bundle activator using `BundleContext` and `LogService`. |
| [`src/bundles/alpha/WelcomeService.ts`](./src/bundles/alpha/WelcomeService.ts) | A decorated `@Component` exposing a service interface. |
| [`src/bundles/beta/CounterService.ts`](./src/bundles/beta/CounterService.ts)   | A second decorated component in a separate bundle.     |
| [`src/pages/`](./src/pages/)       | React pages consuming the declared services through hooks.             |

## Running the example

From the monorepo root:

```bash
pnpm install
pnpm dev:example
```

Or from this directory:

```bash
pnpm dev     # start Vite in development mode
pnpm build   # type-check and produce a production build
pnpm preview # serve the production build locally
```

## Related packages

- [`@pandino/pandino`](../pandino/README.md)
- [`@pandino/decorators`](../decorators/README.md)
- [`@pandino/react-hooks`](../react-hooks/README.md)
- [`@pandino/rollup-bundle-plugin`](../rollup-bundle-plugin/README.md)

## License

Eclipse Public License - v 2.0
