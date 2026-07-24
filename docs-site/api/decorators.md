---
title: Decorators API Reference
description: API reference for @pandino/decorators - all available decorators and their options.
---

# Decorators API Reference

All exports from `@pandino/decorators`.

```ts
import { Component, Service, Reference, Activate, Deactivate, Modified } from '@pandino/decorators';
```

## Class Decorators

| Decorator                      | Target | Description                                                     |
| ------------------------------ | ------ | --------------------------------------------------------------- |
| `@Component(options?)`         | Class  | Declares a class as a Declarative Services component            |
| `@Service(options?)`           | Class  | Registers the component as a service under specified interfaces |
| `@Immediate`                   | Class  | Marks the component for immediate activation                    |
| `@Factory(factoryId)`          | Class  | Declares a factory component                                    |
| `@ConfigurationPolicy(policy)` | Class  | Sets the configuration policy                                   |
| `@Scope(scope)`                | Class  | Sets the service scope                                          |
| `@Property(key, value)`        | Class  | Adds a static property to the component                         |

### @Component

```ts
@Component({
  name: 'com.example.my-service',
  immediate: true,
  configurationPid: 'com.example.config',
})
class MyServiceImpl {}
```

| Option                 | Type                                     | Default        | Description                                             |
| ---------------------- | ---------------------------------------- | -------------- | ------------------------------------------------------- |
| `name?`                | `string`                                 | Class name     | Unique component name                                   |
| `immediate?`           | `boolean`                                | `false`        | Activate immediately, even without service consumers    |
| `enabled?`             | `boolean`                                | `true`         | Whether the component is enabled at bundle start        |
| `configurationPid?`    | `string`                                 | —              | Configuration Admin PID (unset means no configuration)  |
| `configurationPolicy?` | `'optional' \| 'require' \| 'ignore'`    | `'optional'`   | How configuration affects activation                    |
| `factory?`             | `string`                                 | -              | Factory identifier; makes this a factory component      |
| `scope?`               | `'singleton' \| 'bundle' \| 'prototype'` | `'singleton'`  | Component instance scope                                |
| `service?`             | `ServiceDescriptor`                      | -              | Inline service registration (alternative to `@Service`) |
| `properties?`          | `Record<string, any>`                    | `{}`           | Component/service properties                            |
| `references?`          | `ReferenceDescriptor[]`                  | `[]`           | Inline reference declarations                           |
| `activate?`            | `string`                                 | -              | Name of the activate method                             |
| `deactivate?`          | `string`                                 | -              | Name of the deactivate method                           |
| `modified?`            | `string`                                 | -              | Name of the modified method                             |

### @Service

```ts
@Service({ interfaces: ['MyService', 'Disposable'] })
class MyServiceImpl {}
```

| Option        | Type                                     | Default       | Description                       |
| ------------- | ---------------------------------------- | ------------- | --------------------------------- |
| `interfaces?` | `string[]`                               | `[ClassName]` | Interface names to register under |
| `scope?`      | `'singleton' \| 'bundle' \| 'prototype'` | `'singleton'` | Service scope                     |

### @Immediate

No options. Shorthand for `@Component({ immediate: true })`.

```ts
@Component({ name: 'my.service' })
@Service({ interfaces: ['MyService'] })
@Immediate
class MyServiceImpl {}
```

### @Factory

```ts
@Component({ name: 'my.factory' })
@Factory('my.factory.id')
class MyFactoryComponent {}
```

| Parameter   | Type     | Description                       |
| ----------- | -------- | --------------------------------- |
| `factoryId` | `string` | Unique identifier for the factory |

### @ConfigurationPolicy

```ts
@Component({ name: 'my.configured.service' })
@ConfigurationPolicy('require')
class MyConfiguredService {}
```

| Parameter | Type                                  | Description                                                                                                        |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `policy`  | `'optional' \| 'require' \| 'ignore'` | `'optional'` activates with or without config; `'require'` needs config to activate; `'ignore'` ignores any config |

### @Scope

```ts
@Component({ name: 'my.prototype.service' })
@Service({ interfaces: ['MyService'] })
@Scope('prototype')
class MyPrototypeService {}
```

| Parameter | Type                                     | Description                                                                                                  |
| --------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `scope`   | `'singleton' \| 'bundle' \| 'prototype'` | `'singleton'` = one instance; `'bundle'` = one per consuming bundle; `'prototype'` = new instance per lookup |

### @Property

```ts
@Component({ name: 'my.service' })
@Property('service.vendor', 'Example Corp')
@Property('service.ranking', 10)
class MyServiceImpl {}
```

| Parameter | Type     | Description    |
| --------- | -------- | -------------- |
| `key`     | `string` | Property key   |
| `value`   | `any`    | Property value |

## Field Decorators

### @Reference

Injects a service dependency into a field.

```ts
@Component({ name: 'my.consumer' })
class MyConsumer {
  @Reference({ interface: 'LogService' })
  private logger?: LogService;

  @Reference({ interface: 'DataService', cardinality: '0..n', policy: 'dynamic' })
  private dataSources?: DataService[];
}
```

| Option          | Type                                              | Default       | Description                                                                                                  |
| --------------- | ------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `name?`         | `string`                                          | Field name    | Reference name, used to identify bind/unbind methods                                                         |
| `interface?`    | `string`                                          | `'any'`       | Service interface to bind                                                                                    |
| `cardinality?`  | `'1..1' \| '0..1' \| '1..n' \| '0..n'`            | `'1..1'`      | `1..1` = mandatory single; `0..1` = optional single; `1..n` = mandatory multiple; `0..n` = optional multiple |
| `policy?`       | `'static' \| 'dynamic'`                           | `'static'`    | `'static'` requires deactivation to rebind; `'dynamic'` allows live rebinding                                |
| `policyOption?` | `'reluctant' \| 'greedy'`                         | `'reluctant'` | `'reluctant'` keeps current binding; `'greedy'` rebinds to better matches immediately                        |
| `target?`       | `string`                                          | -             | LDAP filter applied to the referenced service properties                                                     |
| `bind?`         | `string`                                          | -             | Name of bind callback method                                                                                 |
| `unbind?`       | `string`                                          | -             | Name of unbind callback method                                                                               |
| `updated?`      | `string`                                          | -             | Name of updated callback method                                                                              |
| `field?`        | `string`                                          | Field name    | Target field for injection                                                                                   |
| `fieldOption?`  | `'replace' \| 'update'`                           | `'replace'`   | `'replace'` swaps the field value; `'update'` mutates in place                                               |
| `scope?`        | `'bundle' \| 'prototype' \| 'prototype_required'` | `'bundle'`    | Required scope for the referenced service                                                                    |

## Method Decorators

| Decorator     | Target | Description                                |
| ------------- | ------ | ------------------------------------------ |
| `@Activate`   | Method | Called when the component is activated     |
| `@Deactivate` | Method | Called before the component is deactivated |
| `@Modified`   | Method | Called when bound configuration changes    |

### @Activate

Receives a `ComponentContext` parameter.

```ts
@Component({ name: 'my.service', immediate: true })
class MyServiceImpl {
  @Activate
  activate(context: ComponentContext): void {
    const bundleContext = context.getBundleContext();
    const props = context.getProperties();
  }
}
```

### @Deactivate

```ts
@Component({ name: 'my.service', immediate: true })
class MyServiceImpl {
  @Deactivate
  deactivate(): void {
    // cleanup resources
  }
}
```

### @Modified

```ts
@Component({ name: 'my.service', configurationPid: 'my.config' })
class MyServiceImpl {
  @Modified
  configChanged(): void {
    // react to configuration updates
  }
}
```

## Interfaces

| Export                   | Type      | Description                                   |
| ------------------------ | --------- | --------------------------------------------- |
| `ComponentDescriptor`    | Interface | Full component metadata shape                 |
| `ReferenceDescriptor`    | Interface | Reference metadata shape                      |
| `ServiceDescriptor`      | Interface | Service registration metadata                 |
| `OSGiConstructor<T>`     | Type      | Constructor type: `new (...args: any[]) => T` |
| `COMPONENT_METADATA_KEY` | Constant  | Reflect metadata key: `'osgi:component'`      |

### ComponentDescriptor

| Property               | Type                                     | Description               |
| ---------------------- | ---------------------------------------- | ------------------------- |
| `name`                 | `string`                                 | Component name            |
| `implementation`       | `string \| Function`                     | Implementation class      |
| `class?`               | `any`                                    | Direct class reference    |
| `properties?`          | `Record<string, any>`                    | Component properties      |
| `references?`          | `ReferenceDescriptor[]`                  | Service references        |
| `activate?`            | `string`                                 | Activate method name      |
| `deactivate?`          | `string`                                 | Deactivate method name    |
| `modified?`            | `string`                                 | Modified method name      |
| `configurationPid?`    | `string`                                 | Configuration PID         |
| `configurationPolicy?` | `'optional' \| 'require' \| 'ignore'`    | Configuration policy      |
| `factory?`             | `string`                                 | Factory identifier        |
| `immediate?`           | `boolean`                                | Immediate activation flag |
| `enabled?`             | `boolean`                                | Enabled at bundle start   |
| `scope?`               | `'singleton' \| 'bundle' \| 'prototype'` | Component scope           |
| `service?`             | `ServiceDescriptor`                      | Service descriptor        |

### ReferenceDescriptor

| Property        | Type                                              | Description                        |
| --------------- | ------------------------------------------------- | ---------------------------------- |
| `name`          | `string`                                          | Reference name                     |
| `interface`     | `string`                                          | Target service interface           |
| `cardinality`   | `'1..1' \| '0..1' \| '1..n' \| '0..n'`            | Reference cardinality              |
| `policy`        | `'static' \| 'dynamic'`                           | Binding policy                     |
| `policyOption?` | `'reluctant' \| 'greedy'`                         | Rebinding strategy                 |
| `target?`       | `string`                                          | LDAP filter for the target service |
| `bind?`         | `string`                                          | Bind method name                   |
| `unbind?`       | `string`                                          | Unbind method name                 |
| `updated?`      | `string`                                          | Updated method name                |
| `field?`        | `string`                                          | Injection field name               |
| `fieldOption?`  | `'replace' \| 'update'`                           | Field update strategy              |
| `scope?`        | `'bundle' \| 'prototype' \| 'prototype_required'` | Required service scope             |

### ServiceDescriptor

| Property      | Type                                     | Description                  |
| ------------- | ---------------------------------------- | ---------------------------- |
| `interfaces?` | `string[]`                               | Interfaces to register under |
| `scope?`      | `'singleton' \| 'bundle' \| 'prototype'` | Service scope                |
