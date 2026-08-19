---
title: Debugging Declarative Services (SCR)
description: How to inspect and debug the Service Component Runtime - turn on framework logging, watch lifecycle events, inspect component state, and read common failure signatures.
---

# Debugging Declarative Services (SCR)

When a component does not activate, a `@Reference` is never injected, or activation throws, the Service Component Runtime (SCR) gives you several ways to see exactly what happened. This page walks through them from cheapest to most detailed.

If you are new to SCR, read [Declarative Services](/concepts/declarative-services) first — this guide assumes you know what `@Component`, `@Service`, and `@Reference` do.

## Turn on framework logging

SCR logs its decisions (activation attempts, unsatisfied references, circular dependencies) through the framework logger. The default log level is `INFO`; raise it to `DEBUG` (or `TRACE` for the most detail) to see SCR's decisions.

```typescript
import { OSGiBootstrap, LogLevel } from '@pandino/pandino';

const bootstrap = new OSGiBootstrap({
  frameworkLogLevel: LogLevel.DEBUG,
});
const framework = await bootstrap.start();
```

You can also change the level at runtime through the `LogService`:

```typescript
import { LogLevel } from '@pandino/pandino';
import type { LogService } from '@pandino/pandino';

const context = framework.getBundleContext();
const logRef = context.getServiceReference<LogService>('LogService')!;
const log = context.getService(logRef)!;

log.setLogLevel(LogLevel.DEBUG);
```

Log levels are `AUDIT (0)`, `ERROR (1)`, `WARN (2)`, `INFO (3)`, `DEBUG (4)`, `TRACE (5)`. A message is shown when its numeric value is `<=` the configured level, so a _higher_ configured level shows more messages. `AUDIT` is always recorded regardless of the threshold.

## Capture logs programmatically

To collect logs in a test or route them somewhere other than the console, attach a `LogListener`:

```typescript
const log = context.getService(context.getServiceReference<LogService>('LogService')!)!;

log.addLogListener({
  logged(entry) {
    // entry: { level, message, timestamp, bundle?, exception?, context? }
    console.log(`[${entry.level}] ${entry.message}`, entry.context ?? '');
  },
});
```

## Watch SCR lifecycle events

SCR publishes an event through `EventAdmin` at each lifecycle step. Subscribing to them is the most reliable way to see what SCR is doing, because you get a structured payload instead of parsing log lines.

| Topic                          | Published when                              | Payload keys                                                 |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------ |
| `scr/component/registered`     | a component is registered with SCR          | `bundle.id`, `component.name`, `decorators`                  |
| `scr/component/activated`      | a component becomes ACTIVE                  | `bundle.id`, `component.name`, `decorators`                  |
| `scr/component/deactivated`    | a component is deactivated                  | `bundle.id`, `component.name`, `decorators`                  |
| `scr/component/config-updated` | a component's configuration changed         | `bundle.id`, `component.name`, `configuration`, `decorators` |
| `scr/component/removed`        | a component is removed (bundle uninstalled) | `bundle.id`, `component.name`, `decorators`                  |

Register an `EventHandler` service and subscribe with a wildcard topic:

```typescript
import type { EventHandler } from '@pandino/pandino';

const handler: EventHandler = {
  handleEvent(event) {
    console.log(
      'SCR:',
      event.getTopic(),
      event.getProperty('component.name'),
      'bundle',
      event.getProperty('bundle.id'),
    );
  },
};

context.registerService('EventHandler', handler, {
  'event.topics': 'scr/component/*',
});
```

If a component you expect never shows a `scr/component/activated` event (only `scr/component/registered`), it is stuck **UNSATISFIED** — jump to [common signatures](#common-failure-signatures).

## Inspect a component's state directly

The `ServiceComponentRuntime` service lets you look at any component's live entry. `getComponent(bundleId, name)` returns the entry or `undefined`.

```typescript
import type { ServiceComponentRuntime } from '@pandino/pandino';

const scr = context.getService(context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime')!)!;

const bundleId = context.getBundle().getBundleId();
const entry = scr.getComponent(bundleId, 'com.example.my-component');

console.log('active?    ', entry?.instance != null); // null while UNSATISFIED
console.log('registered as service?', entry?.serviceRegistration != null);
console.log('immediate? ', entry?.metadata.immediate);
console.log(
  'references ',
  entry?.metadata.references?.map((r) => ({
    interface: r.interface,
    cardinality: r.cardinality,
    policy: r.policy,
    target: r.target,
  })),
);
```

Key fields on the entry:

- **`instance`** — the live object, or `null`. For singleton components `null` means the component is **not active** (UNSATISFIED). Prototype- and bundle-scoped components stay `null` by design and expose `serviceRegistration` instead.
- **`serviceRegistration`** — present once the component's service is published.
- **`metadata.references`** — the resolved `@Reference` descriptors, including the `cardinality`, `policy`, and `target` filter actually in effect.
- **`metadata.configurationPolicy` / `configurationPid`** — why a `require`-policy component might be waiting for configuration.

## Common failure signatures

### Component never activates (`instance` stays `null`)

A singleton `immediate` component whose `instance` is `null` has an **unsatisfied mandatory reference**. Check each `@Reference` with cardinality `1..1` or `1..n`:

- Is the target service actually registered? Query it: `context.getServiceReferences('ThatInterface', null)`.
- Does the `target` LDAP filter match the provider's properties?
- Is the interface **string** spelled identically on both sides? References resolve by interface name, so `'UserService'` and `'userService'` are different services.

Activation is **not** sensitive to registration order — a component activates automatically as soon as its providers come up, even if they are registered afterwards. If a component stays unsatisfied, the dependency is genuinely missing or filtered out, not "registered too late."

### `Mandatory reference <interface> not satisfied` (thrown)

SCR tried to activate the component but a `1..1`/`1..n` reference had no matching service at activation time. For a `static` + mandatory reference this aborts activation. Either provide the service before the consumer is enabled, or make the reference `dynamic` so it can bind later:

```typescript
@Reference({ interface: 'LateService', cardinality: '1..1', policy: 'dynamic' })
```

### `Circular reference detected: A -> B -> A`

Two (or more) components each require the other. SCR logs the full chain. Break the cycle by making one side's reference **optional** (`0..1`/`0..n`) or **dynamic**, or by introducing an intermediary service.

### A reference binds but the field is `undefined` in `@Activate`

Field injection and `@Activate` both run during activation. If you read an injected field inside a constructor it will be `undefined` — move the logic into the `@Activate` method, which runs after references are bound.

## Step-through debugging with breakpoints

To watch resolution happen line by line, run under an inspector (`node --inspect-brk` for Node, or the browser devtools for a bundled app) and set breakpoints inside the SCR source (`@pandino/pandino` → `services/declarative-services/scr.ts`). The most useful methods to break on:

- **`registerComponent`** — see each component as SCR learns about it.
- **`canActivateComponent`** — see the per-reference satisfaction check that decides whether activation proceeds.
- **`activateComponent`** — the activation itself (instance creation, service registration, `@Activate`).
- **`satisfyReference`** — the actual field/bind injection for a single `@Reference`.

Watching `canActivateComponent` return `false` tells you _which_ reference is blocking activation.

## Checklist

1. Set `frameworkLogLevel: LogLevel.DEBUG`.
2. Subscribe to `scr/component/*` events — confirm you see `registered` **and** `activated` for the component.
3. If only `registered` appears, call `scr.getComponent(...)` and inspect `metadata.references`.
4. For each mandatory reference, verify the provider is registered and any `target` filter matches.
5. Break on `canActivateComponent` to find the exact blocking reference.
