# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> See also `AGENTS.md` for behavioral conventions (TDD, simplicity, surgical changes), the OpenSpec workflow, and the discipline-skills checkpoint table. This file (`CLAUDE.md`) is the source of truth for project specifics: architecture, exact commands, and code patterns.

## important-instruction-reminders

- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.

## Project Overview

Pandino is an OSGi-style framework for TypeScript that provides modular architecture, service registry, and dynamic dependency injection. The project follows a monorepo structure with multiple packages managed by pnpm workspaces.

## Common Development Commands

### Build Commands

- `pnpm build` - Build all packages recursively
- `pnpm build:dev` - Build all packages in development mode
- `pnpm build:pandino` - Build only the core pandino package
- `pnpm build:react-hooks` - Build only the React hooks package

### Testing Commands

- `pnpm test` - Run all tests using Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `vitest run --reporter=verbose` - Run tests with detailed output
- Individual package tests: `cd packages/<package-name> && pnpm test`

### Development Commands

- `pnpm dev:example` - Start the example application
- `pnpm lint` - Run oxlint for code linting
- `pnpm format:write` - Format code using oxfmt

### Package Management

- Uses pnpm workspaces with packages in `packages/` directory
- Node.js >=24 and pnpm >=11 required
- Workspace dependencies use `workspace:*` protocol

## Project Architecture

### Core Packages Structure

- `packages/pandino/` - Core framework (service registry, bundles, lifecycle management)
- `packages/react-hooks/` - React integration with hooks and components
- `packages/decorators/` - Decorators for Service Component Runtime (SCR)
- `packages/rollup-bundle-plugin/` - Rollup plugin for bundle automation
- `packages/example/` - Example application demonstrating usage

### Key Architectural Concepts

**Service Registry Pattern**: Central registry where services are registered by interface and discovered dynamically using LDAP-style filters.

**Bundle System**: Self-contained modules with independent lifecycles. Each bundle has an activator that manages service registration/cleanup.

**Service Component Runtime (SCR)**: Declarative service management using decorators (`@Component`, `@Service`, `@Reference`, `@Activate`).

**Dynamic Dependencies**: Services can start in any order - dependencies are resolved automatically when services become available.

### Core Framework Structure (`packages/pandino/src/`)

- `framework/` - Core framework implementation, bootstrap, and bundle management/lifecycle
- `services/` - Built-in services (service registry, event admin, etc.)
- `types/` - TypeScript interfaces and type definitions
- `test/` - Test utilities and setup

## Development Patterns

### Service Definition Pattern

```typescript
// 1. Define interface
interface MyService {
  doSomething(): void;
}

// 2. Implement with SCR decorators
@Component({ name: 'my.service', immediate: true })
@Service({ interfaces: ['MyService'] })
class MyServiceImpl implements MyService {
  @Reference({ interface: 'DependencyService' })
  private dependency?: DependencyService;

  @Activate
  activate(context: ComponentContext): void {
    // Initialization logic
  }
}
```

### Bundle Activator Pattern

```typescript
export class BundleActivator {
  async start(context: BundleContext): Promise<void> {
    // Register services, event listeners
  }

  async stop(context: BundleContext): Promise<void> {
    // Cleanup
  }
}
```

## Testing Configuration

- Vitest configuration in root and individual packages
- Uses jsdom environment for DOM-related tests
- Coverage reports with @vitest/coverage-v8
- Test files follow `*.test.ts` pattern

## Code Quality Tools

### Formatting & Linting

- **oxfmt**: Code formatting with 2-space indentation, 120 character line width
- **oxlint**: Fast linting
- **TypeScript**: Strict type checking with multiple tsconfig files

### Import Organization

- Use `reflect-metadata` for decorator support
- Peer dependency on `@pandino/decorators`

## Build System

- **Vite**: Module bundling with TypeScript support
- **vite-plugin-dts**: Automatic TypeScript declaration generation
- **Dual Format**: Generates both ESM and CJS outputs
- **Type Exports**: Proper TypeScript module resolution support

## Key Files for Understanding

- `packages/pandino/src/framework/framework.ts` - Core framework implementation
- `packages/pandino/src/services/` - Built-in service implementations
- `packages/pandino/src/types/` - Type definitions for the entire system
- Root `package.json` - Workspace configuration and scripts
