---
title: Fragment Pattern
description: The Fragment Pattern in Pandino - attaching bundles to hosts to contribute components, resources, translations, and themes.
---

# The Fragment Pattern

## What is the Fragment Pattern?

The Fragment Pattern is a powerful OSGi concept that allows a bundle (the fragment) to attach to another bundle (the host) and contribute its resources directly to the host. Fragments don't have an independent lifecycle; they are completely tied to their host bundle.

Think of fragments like add-on packs for a video game; they can't run on their own, but they add new features, languages, or content to the main game.

## Core Concepts

### No Independent Lifecycle

A fragment cannot be started or stopped on its own. Its lifecycle is completely tied to its host bundle. It becomes active when the host is active and inactive when the host is inactive.

### No Activator

Fragments cannot have their own BundleActivator. Any startup logic must be handled by the host. While fragments can define an activator, it will never be called.

### Shared Identity

A fragment shares the BundleContext of its host. From the perspective of the rest of the framework, the resources and classes from the fragment appear as if they were originally part of the host bundle itself.

## How Fragments Work in Pandino

### 1. Fragment Declaration

To declare a bundle as a fragment, add a `fragmentHost` header to the bundle's headers:

```typescript
export default {
  headers: {
    bundleSymbolicName: '@example/fragment',
    bundleVersion: '1.0.0',
    // Specify the host bundle this fragment attaches to
    fragmentHost: '@example/host',
  },
  // Components will be merged with the host's components
  components: [LocalizationComponent],
};
```

The `fragmentHost` property can also include a version range:

```typescript
// Attach to any version of the host
fragmentHost: '@example/host',

// Attach to a specific version of the host
fragmentHost: '@example/host;bundle-version="1.0.0"',

// Attach to a range of versions (inclusive start, exclusive end)
fragmentHost: '@example/host;bundle-version="[1.0.0,2.0.0)"',
```

### 2. Fragment Resolution

When a fragment bundle is installed, the framework:

1. Identifies it as a fragment by checking for the `fragmentHost` header
2. Finds the matching host bundle based on the symbolic name and version range
3. If the host is already resolved or active, attaches the fragment immediately
4. If the host is not yet resolved, the fragment will be attached when the host is resolved

### 3. Resource Merging

When a fragment is attached to a host, its resources are merged with the host's using a modular resource processor mechanism:

- **Components**: The declarative services module merges the fragment's components with the host's
- **Resources Map**: Resource maps from fragments are merged with their hosts
- **Custom Resources**: You can create custom resource processors to handle other types of resources (translations, themes, etc.)

### 4. Host-Driven Resource Discovery

In a browser environment, Pandino uses a host-driven resource discovery approach:

1. Resources are listed in the bundle's manifest as a resources map
2. The host bundle uses the Resource API to query resources from itself and its attached fragments

#### Resources Map

Each bundle can define a resources map in its manifest:

```typescript
export default {
  headers: {
    bundleSymbolicName: '@example/bundle',
    bundleVersion: '1.0.0',
  },
  // Map of logical paths to actual URLs
  resources: {
    'assets/theme.css': '/dist/dark-theme.a8c3f.css',
    'i18n/en.json': '/dist/translations/english.b7d2e.json',
  },
};
```

#### Resource API

The Bundle interface provides methods for querying resources:

```typescript
// Get a specific resource by path
const cssUrl = bundle.getResource('assets/theme.css');
if (cssUrl) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
}

// Find all JSON files in the i18n directory
const translationUrls = bundle.findResources('i18n', '*.json');
for (const url of translationUrls) {
  fetch(url)
    .then((response) => response.json())
    .then((translations) => {
      // Process translations
    });
}
```

For host bundles, these methods search for resources in both the host bundle's own resources map and the resources maps of any attached fragments.

### 5. Lifecycle Binding

- When a host bundle is started, all of its fragments are attached to it
- When a host bundle is stopped, all of its fragments are detached from it
- Fragments cannot be started or stopped directly

## Key Use Cases

### Localization

```typescript
// Host bundle: Core UI with default English strings
export default {
  headers: {
    bundleSymbolicName: '@example/ui',
    bundleVersion: '1.0.0',
  },
  components: [Button, TextField, Dialog],
};

// Fragment bundle: German translations
export default {
  headers: {
    bundleSymbolicName: '@example/ui-german',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/ui',
  },
  components: [GermanTranslations],
};
```

### Platform-Specific Code

```typescript
// Host bundle: Storage API
export default {
  headers: {
    bundleSymbolicName: '@example/storage',
    bundleVersion: '1.0.0',
  },
  components: [StorageAPI],
};

// Fragment: Browser implementation
export default {
  headers: {
    bundleSymbolicName: '@example/storage-browser',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/storage',
  },
  components: [BrowserStorageImpl],
};
```

### Theming

```typescript
// Host: UI components
export default {
  headers: {
    bundleSymbolicName: '@example/ui',
    bundleVersion: '1.0.0',
  },
  resources: {
    'assets/base.css': '/dist/base-styles.a1b2c3.css',
  },
  components: [Button, TextField, Dialog],
};

// Fragment: Dark theme
export default {
  headers: {
    bundleSymbolicName: '@example/ui-theme-dark',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/ui',
  },
  resources: {
    'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
  },
};
```

### Custom Resource Processors

To create a custom resource processor, implement the `FragmentResourceProcessor` interface:

```typescript
export interface FragmentResourceProcessor {
  getResourceType(): string;
  processResources(host: Bundle, fragment: Bundle): boolean;
}
```

Register it as a service:

```typescript
async start(context: BundleContext): Promise<void> {
  context.registerService('FragmentResourceProcessor', new TranslationResourceProcessor());
}
```

## Best Practices

- **Naming**: Name fragment bundles clearly to indicate their host (e.g., `@example/host-fragment`).
- **Version Ranges**: Be specific with `fragmentHost` version ranges to avoid incompatible attachments.
- **Design for Fragments**: If a component might be extended by fragments, design it to handle additional resources.
- **Testing**: Test your host bundle both with and without its fragments.

## See also

- [Bundles concept](/concepts/bundles) -- bundle lifecycle and structure
- [Extender Pattern](/patterns/extender-pattern) -- how SCR processes components
- [Core Framework guide](/guide/core-framework) -- writing bundles
