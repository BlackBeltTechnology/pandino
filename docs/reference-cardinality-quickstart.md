# Reference Cardinality Quick Start

## TL;DR - Why Your References Aren't Working

If you're here because your `@Reference` fields are `undefined`, here's what you need to know:

### The Problem

```typescript
@Reference({ interface: 'IResourceManager', cardinality: "1..1" })
private rcManager?: IResourceManager;  // ← Still undefined!
```

**With `cardinality: "1..1"` (mandatory), your component will NOT activate until the required service is available.**

## Quick Solutions

### Solution 1: Make It Optional (Fastest Fix)

```typescript
@Reference({ interface: 'IResourceManager', cardinality: "0..1" })
private rcManager?: IResourceManager;
```

Then add null checks where you use it:
```typescript
if (this.rcManager) {
  this.rcManager.doSomething();
}
```

### Solution 2: Wait for Service Availability

**The framework automatically activates components when dependencies are satisfied.**

If your component isn't activating with `cardinality: "1..1"`, the service isn't registered yet. The component will activate automatically once the service becomes available. This is normal OSGi behavior - you don't need to worry about registration order.

Check if the service provider is properly configured:
```typescript
@Component({ name: 'resource.manager', immediate: true, enabled: true })
@Service({ interfaces: ['IResourceManager'] })
export class ResourceManager {
  // ...
}
```

### Solution 3: Use Dynamic Policy

```typescript
@Reference({
  interface: 'IResourceManager',
  cardinality: "1..1",
  policy: "dynamic"  // Can bind after activation
})
private rcManager?: IResourceManager;
```

## Verify Your Services Are Registered Correctly

### Check 1: Does the provider have @Service?

```typescript
// ❌ WRONG - Not exposed as a service
@Component({ name: 'resource.manager' })
export class ResourceManager {
  // ...
}

// ✅ CORRECT - Exposed with interface name
@Component({ name: 'resource.manager', immediate: true })
@Service({ interfaces: ['IResourceManager'] })
export class ResourceManager implements IResourceManager {
  // ...
}
```

### Check 2: Do interface names match EXACTLY?

```typescript
// Provider
@Service({ interfaces: ['IResourceManager'] })  // ← This name

// Consumer
@Reference({ interface: 'IResourceManager' })   // ← Must match this name
```

Common mistakes:
- `'ResourceManager'` vs `'IResourceManager'`
- `'resourceManager'` vs `'ResourceManager'` (case sensitive!)
- Typos in interface names

### Check 3: Is the provider immediate?

```typescript
@Component({
  name: 'resource.manager',
  immediate: true,  // ← Required for services needed during startup
  enabled: true
})
@Service({ interfaces: ['IResourceManager'] })
export class ResourceManager {
  // ...
}
```

## Understanding Cardinality

| Cardinality | Meaning | Component Activates When... |
|-------------|---------|----------------------------|
| `"0..1"` | Optional, max 1 | Always (even if service absent) |
| `"1..1"` | **Mandatory, exactly 1** | **Service is available** |
| `"0..n"` | Optional, any number | Always (even if no services) |
| `"1..n"` | **Mandatory, at least 1** | **At least one service available** |

## Common Patterns

### Pattern 1: Mandatory Dependencies

For services that absolutely must be present for the component to function:

```typescript
@Component({ name: 'my.component', immediate: true })
export class MyComponent {
  // These MUST be available for component to work
  @Reference({ interface: 'EventAdmin', cardinality: '1..1' })
  private eventAdmin!: EventAdmin;

  @Reference({ interface: 'LogService', cardinality: '1..1' })
  private logger!: LogService;

  @Activate
  activate() {
    // Component activates automatically when all dependencies are available
    this.logger.info('MyComponent activated');
  }
}
```

**Note**: The component waits until these services are available, then activates automatically.

### Pattern 2: Optional Features

For services that enhance functionality but aren't required:

```typescript
@Component({ name: 'my.component', immediate: true })
export class MyComponent {
  // These are nice to have but not required
  @Reference({ interface: 'IThemeProvider', cardinality: '0..1' })
  private themeProvider?: IThemeProvider;

  someMethod() {
    if (this.themeProvider) {
      // Use custom theme
    } else {
      // Use default
    }
  }
}
```

### Pattern 3: Mixed (Mandatory + Optional)

```typescript
@Component({ name: 'workbench.handler', immediate: true })
export class WorkbenchHandler {
  // Core service - must be available
  @Reference({ interface: 'EventAdmin', cardinality: '1..1' })
  private eventAdmin!: EventAdmin;

  // Optional services - may come later or not at all
  @Reference({ interface: 'IResourceManager', cardinality: '0..1' })
  private rcManager?: IResourceManager;

  @Reference({ interface: 'IPerspectiveHandler', cardinality: '0..1' })
  private prHandler?: IPerspectiveHandler;
}
```

## Debugging Checklist

When references aren't working, check these in order:

- [ ] Does the provider class have `@Service({ interfaces: ['TheInterfaceName'] })`?
- [ ] Does the interface name in `@Reference({ interface: 'TheInterfaceName' })` match EXACTLY?
- [ ] Is the provider component `enabled: true`?
- [ ] Is the provider component `immediate: true` (if it should start automatically)?
- [ ] Are both components in the same bundle (or is service scope appropriate)?
- [ ] If using `cardinality: "1..1"`, wait for the service to be registered (component activates automatically)
- [ ] Are there any circular dependencies?

## Still Not Working?

Add debug logging:

```typescript
@Activate
activate(context: ComponentContext) {
  const bc = context.getBundleContext();

  // Check each required service
  const rm = bc.getServiceReferences('IResourceManager');
  console.log('IResourceManager services:', rm?.length || 0);

  const ph = bc.getServiceReferences('IPerspectiveHandler');
  console.log('IPerspectiveHandler services:', ph?.length || 0);

  console.log('rcManager injected:', this.rcManager !== undefined);
  console.log('prHandler injected:', this.prHandler !== undefined);
}
```

## Next Steps

- See [working examples](../packages/example/src/bundles/)
- Check [OSGi DS specification](https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.component.html)

