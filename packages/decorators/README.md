# @pandino/decorators

[![npm version](https://badge.fury.io/js/@pandino%2Fdecorators.svg)](https://badge.fury.io/js/@pandino%2Fdecorators)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-EPL2.0-blue.svg)](LICENSE.txt)

TypeScript decorators for the Pandino framework that enable declarative service components.

## Installation

```bash
npm install @pandino/decorators
```

## TypeScript Configuration

To use these decorators, you must enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Available Decorators

- `@Component` - Defines a component with lifecycle and configuration options
- `@Service` - Exposes a component as a service with specified interfaces
- `@Reference` - Injects service dependencies into components
- `@Property` - Adds component properties
- `@Activate` - Marks a method to be called when the component is activated
- `@Deactivate` - Marks a method to be called when the component is deactivated
- `@Modified` - Marks a method to be called when the component's configuration changes
- `@ConfigurationPolicy` - Specifies how configuration is handled
- `@Factory` - Marks a component as a factory
- `@Immediate` - Indicates a component should be activated immediately
- `@Scope` - Defines the service scope (singleton, bundle, prototype)

## Usage

For detailed usage examples and documentation, please refer to the [Pandino Framework Documentation](../pandino/README.md#declarative-services).

## License

Eclipse Public License - v 2.0
