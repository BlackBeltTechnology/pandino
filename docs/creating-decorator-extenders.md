# Creating Decorator Extenders

Build small extenders that react to component decorators and wire your own features (UI, views, routing, etc.) without re‑implementing SCR.

What you use:

- getDecoratorInfo(target) — one call for all decorator metadata.
- EventAdmin — SCR posts component lifecycle events carrying DecoratorInfo.
- Custom metadata — read your own reflect‑metadata without hard‑coding names.

See also:

- [docs/extender-pattern.md](./extender-pattern.md) (concepts)
- [docs/whiteboard-pattern.md](./whiteboard-pattern.md) (EventAdmin)

## Event‑driven micro‑extender

Subscribe to SCR topics so your extender reacts as components appear/change without re‑scanning.

Topics to handle:

- scr/component/registered
- scr/component/activated
- scr/component/deactivated
- scr/component/removed
- scr/component/config-updated

Event properties (recommended):

- bundle.id: number
- bundle.symbolicName?: string
- component.name: string
- decorators: DecoratorInfo (from getDecoratorInfo)
  - component, service, configuration, lifecycle, references, rawMetadata,
  - customDecorators, customFieldDecorators, customMethodDecorators

Handler example:

```ts
import type { EventHandler, Event } from '@pandino/pandino';
import { Component, Service, Property } from '@pandino/decorators';

@Component({ name: 'custom.decorator.extender' })
@Service({ interfaces: ['EventHandler'] })
@Property('event.topics', 'scr/component/*')
export class CustomDecoratorExtender implements EventHandler {
  handleEvent(event: Event): void {
    const info = event.getProperty('decorators'); // DecoratorInfo

    // Class-level metadata
    const cls = info?.customDecorators || {};
    // Field-level metadata per field name
    const fields = info?.customFieldDecorators || {};
    // Method-level metadata per method name
    const methods = info?.customMethodDecorators || {};

    // Example: react on registration only
    if (event.getTopic().endsWith('/registered')) {
      if (cls['my:feature']) {
        // wire your feature based on class-level metadata
      }
      if (fields.logger?.['my:field']) {
        // set up logger UI hook, etc.
      }
      if (methods.doWork?.['my:method']) {
        // wrap/augment a method behavior
      }
    }
  }
}
```

## Reading custom metadata (class, field, method)

Define decorators in your app that store reflect‑metadata; SCR exposes them via DecoratorInfo.

```ts
// This is important:
import 'reflect-metadata';

export function Feature(meta: any) {
  return (target: Function) => Reflect.defineMetadata('my:feature', meta, target);
}
export function FieldFeature(meta: any) {
  return (target: any, key: string | symbol) => Reflect.defineMetadata('my:field', meta, target, key);
}
export function MethodFeature(meta: any) {
  return (target: any, key: string | symbol, _d: PropertyDescriptor) =>
    Reflect.defineMetadata('my:method', meta, target, key);
}

@Feature({ view: 'react', tpl: 'page' })
class PageComponent {
  @FieldFeature({ role: 'logger' }) private logger?: any;
  @MethodFeature({ role: 'op' }) doWork() {}
}
```

Access in handler:

```ts
const info = event.getProperty('decorators');
const cls = info.customDecorators['my:feature'];
const fld = info.customFieldDecorators['logger']?.['my:field'];
const mtd = info.customMethodDecorators['doWork']?.['my:method'];
```

Notes:

- design:\* and Pandino internal keys are filtered out from these maps.
- Field names are inferred from DS references when present.

## Best practices

- Keep extenders tiny and single‑purpose; filter early by topic/properties.
- Cache results; invalidate on deactivated/removed.
- Offload heavy work; use postEvent for async pipelines.
- Prefer Whiteboard style: register as services and let the framework route events.

## References

- [docs/extender-pattern.md](./extender-pattern.md) — Conceptual overview of SCR as an extender
- [docs/whiteboard-pattern.md](./whiteboard-pattern.md) — EventAdmin and event handling
- [packages/pandino/src/services/declarative-services/reflection.ts](../packages/pandino/src/services/declarative-services/reflection.ts) — getDecoratorInfo helpers
- [packages/decorators](../packages/decorators) — Core decorator package (Component, Service, Property, ...)
