---
sidebar_position: 2
---

# Installation

This guide will help you install Pandino and set up your development environment.

## Prerequisites

- Node.js (version 22 or higher)
- npm, yarn, or pnpm (pnpm 10 or higher recommended)

## Installing Pandino

### Core Framework

To install the core Pandino framework:

```bash
npm install @pandino/pandino
```

Or with yarn:

```bash
yarn add @pandino/pandino
```

Or with pnpm:

```bash
pnpm add @pandino/pandino
```

### React Integration

If you're building a React application, you'll also want to install the React hooks package:

```bash
npm install @pandino/pandino @pandino/react-hooks
```

Or with yarn:

```bash
yarn add @pandino/pandino @pandino/react-hooks
```

Or with pnpm:

```bash
pnpm add @pandino/pandino @pandino/react-hooks
```

### Decorators for Declarative Services

For using TypeScript decorators with Pandino:

```bash
npm install @pandino/decorators
```

Or with yarn:

```bash
yarn add @pandino/decorators
```

Or with pnpm:

```bash
pnpm add @pandino/decorators
```

## TypeScript Configuration

To use Pandino's decorators, you must enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Without these settings, decorators will not work and you'll get TypeScript compilation errors.

## Next Steps

Once you have installed Pandino, you can proceed to the [Quick Start](/docs/quick-start) guide to create your first Pandino application.
