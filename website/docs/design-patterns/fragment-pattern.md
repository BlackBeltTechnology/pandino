---
sidebar_position: 3
---

# The Fragment Pattern

## What is the Fragment Pattern?

The Fragment Pattern is a powerful OSGi concept that allows a bundle (the fragment) to attach to another bundle (the host) and contribute its resources directly to the host. Fragments don't have an independent lifecycle; they are completely tied to their host bundle.

Think of fragments like add-on packs for a video game; they can't run on their own, but they add new features, languages, or content to the main game.

## Core Concepts of Fragments

### No Independent Lifecycle

A fragment cannot be started or stopped on its own. Its lifecycle is completely tied to its host bundle. It becomes active when the host is active and inactive when the host is inactive.

### No Activator

Fragments cannot have their own BundleActivator. Any startup logic must be handled by the host. While fragments can define an activator, it will never be called.

### Shared Identity

A fragment shares the BundleContext of its host. From the perspective of the rest of the framework, the resources and classes from the fragment appear as if they were originally part of the host bundle itself.

## How Fragments Work in Pandino

### 1. Fragment Declaration

To declare a bundle as a fragment, you add a `fragmentHost` header to the bundle's headers:

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

The `fragmentHost` property can also include a version range to specify which versions of the host bundle the fragment can attach to:

```typescript
// Example of different fragmentHost specifications in bundle headers:

// In bundle headers - attach to any version of the host
export default {
  headers: {
    fragmentHost: '@example/host'
  }
};

// In bundle headers - attach to a specific version of the host
export default {
  headers: {
    fragmentHost: '@example/host;bundle-version="1.0.0"'
  }
};

// In bundle headers - attach to a range of versions (inclusive start, exclusive end)
export default {
  headers: {
    fragmentHost: '@example/host;bundle-version="[1.0.0,2.0.0)"'
  }
};
```

### 2. Fragment Resolution

When a fragment bundle is installed, the framework:

1. Identifies it as a fragment by checking for the `fragmentHost` header
2. Finds the matching host bundle based on the symbolic name and version range
3. If the host is already resolved or active, attaches the fragment to the host immediately
4. If the host is not yet resolved, the fragment will be attached when the host is resolved

### 3. Resource Merging

When a fragment is attached to a host, its resources are merged with the host's using a modular resource processor mechanism:

- **Resource Processors**: The framework uses registered resource processors to handle different types of resources
- **Components**: The declarative services module provides a processor that merges the fragment's components with the host's
- **Resources Map**: The resource management service provides a processor that merges resource maps from fragments with their hosts
- **Custom Resources**: You can create custom resource processors to handle other types of resources (translations, themes, etc.)

This modular approach allows fragments to be useful beyond just declarative services, making them a powerful tool for extending any type of bundle.

### 4. Host-Driven Resource Discovery

In a browser environment, there's no traditional file system to scan for resources. Instead, Pandino uses a host-driven resource discovery approach:

1. Resources are listed in the bundle's manifest as a resources map
2. The host bundle uses the Resource API to query resources from itself and its attached fragments
3. The host actively looks for resources using conventional paths

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
  // ...
};
```

The resources map associates logical paths (the convention the host looks for) with actual URLs (which might be hashed by a build tool).

#### Resource API

The Bundle interface provides methods for querying resources:

```typescript
import type { Bundle } from '@pandino/pandino';

// Get a specific resource by path
const cssUrl = bundle.getResource('assets/theme.css');
if (cssUrl) {
  // Create a link element to apply the CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssUrl;
  document.head.appendChild(link);
}

// Find all JSON files in the i18n directory
const translationUrls = bundle.findResources('i18n', '*.json');
for (const url of translationUrls) {
  // Load the translation file
  fetch(url)
    .then(response => response.json())
    .then(translations => {
      // Process translations
    });
}
```

For host bundles, these methods search for resources in:
1. The host bundle's own resources map
2. The resources maps of any attached fragments

This allows the host to discover and use resources from fragments without knowing which fragment provides them.

#### Example: Fragment with Resources

Here's an example of a fragment that provides resources to its host:

```typescript
// Host bundle: UI components
export default {
  headers: {
    bundleSymbolicName: '@example/ui',
    bundleVersion: '1.0.0',
  },
  resources: {
    'assets/base.css': '/dist/base-styles.a1b2c3.css',
    'i18n/en.json': '/dist/translations/english.d4e5f6.json',
  },
  components: [Button, TextField, Dialog],
};

// Fragment bundle: Dark theme and German translations
export default {
  headers: {
    bundleSymbolicName: '@example/ui-dark-german',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/ui',
  },
  resources: {
    'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
    'i18n/de.json': '/dist/translations/german.j0k1l2.json',
  },
};
```

In the host bundle's code, you can use the Resource API to discover and use these resources:

```typescript
import type { Bundle } from '@pandino/pandino';

class UIManager {
  constructor(private bundle: Bundle) {}

  applyStyles() {
    // Apply base styles
    this.loadStylesheet(this.bundle.getResource('assets/base.css'));

    // Apply theme if available
    const themeUrl = this.bundle.getResource('assets/theme.css');
    if (themeUrl) {
      this.loadStylesheet(themeUrl);
    }
  }

  loadTranslations(locale: string) {
    const translationUrl = this.bundle.getResource(`i18n/${locale}.json`);
    if (translationUrl) {
      return fetch(translationUrl).then(response => response.json());
    }
    return Promise.resolve({});
  }

  private loadStylesheet(url: string | null) {
    if (!url) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}
```

The host bundle doesn't need to know which bundle provides which resource. It simply asks for resources by path, and the framework takes care of finding them in the host or its fragments.

### 5. Lifecycle Binding

Fragments are bound to their host's lifecycle:

- When a host bundle is started, all of its fragments are attached to it
- When a host bundle is stopped, all of its fragments are detached from it
- Fragments cannot be started or stopped directly

## Key Use Cases

### Localization

The host bundle contains the core application logic and default language files (e.g., en.json). Separate fragments can provide translations for other languages (de.json, fr.json). The correct fragment is attached based on the current locale.

```typescript
// Host bundle: Core UI components with default English strings
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
  components: [
    {
      name: 'GermanTranslations',
      translations: {
        'button.submit': 'Absenden',
        'button.cancel': 'Abbrechen',
        'dialog.close': 'Schließen'
      }
    }
  ],
};
```

### Platform-Specific Code

A host bundle can define a generic API (e.g., storage.service.ts). Different fragments can provide the implementation for different environments, like a browser-specific implementation and a Node.js-specific implementation.

```typescript
// Host bundle: Storage API
import { Component, Service } from '@pandino/decorators';

export interface StorageService {
  save(key: string, value: any): Promise<void>;
  load(key: string): Promise<any>;
}

@Component({ name: 'storage.api' })
@Service({ interfaces: ['StorageAPI'] })
class StorageAPI {
  // API definition only, no implementation
}

export default {
  headers: {
    bundleSymbolicName: '@example/storage',
    bundleVersion: '1.0.0',
  },
  components: [StorageAPI],
};

// Fragment bundle: Browser implementation
import { Component, Service } from '@pandino/decorators';
import type { StorageService } from '@example/storage';

@Component({ name: 'browser.storage.impl' })
@Service({ interfaces: ['StorageService'] })
class BrowserStorageImpl implements StorageService {
  async save(key: string, value: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async load(key: string): Promise<any> {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/storage-browser',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/storage',
  },
  components: [BrowserStorageImpl],
};
```

### Adding Declarative Components

A fragment can contain its own component definitions. When the fragment attaches to a host, those components are effectively added to the host bundle. This allows you to extend or patch a bundle with new services without modifying its original source code.

```typescript
// Host bundle: Core application
export default {
  headers: {
    bundleSymbolicName: '@example/app',
    bundleVersion: '1.0.0',
  },
  components: [CoreServices],
};

// Fragment bundle: Additional features
import { Component, Service, Reference } from '@pandino/decorators';

@Component({ name: 'analytics.service' })
@Service({ interfaces: ['AnalyticsService'] })
class AnalyticsService {
  @Reference({ interface: 'LogService' })
  private logger: any;

  trackEvent(category: string, action: string, label?: string): void {
    this.logger.info(`Analytics: ${category} - ${action} - ${label || 'N/A'}`);
    // Send to analytics provider
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/app-analytics',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/app',
  },
  components: [AnalyticsService],
};
```

### Theming and UI Customization

A core UI component library can be the host, with different theme modules as fragments. Each fragment would contain only CSS files and maybe some image assets. When a theme fragment is attached to the host, the UI components are instantly styled with the theme.

```typescript
// Host bundle: UI components
export default {
  headers: {
    bundleSymbolicName: '@example/ui',
    bundleVersion: '1.0.0',
  },
  components: [Button, TextField, Dialog],
};

// Fragment bundle: Dark theme
export default {
  headers: {
    bundleSymbolicName: '@example/ui-theme-dark',
    bundleVersion: '1.0.0',
    fragmentHost: '@example/ui',
  },
  resources: {
    'themes/dark/button.css': '/dist/dark/button.css',
    'themes/dark/textfield.css': '/dist/dark/textfield.css',
    'themes/dark/dialog.css': '/dist/dark/dialog.css',
  },
};
```

## Best Practices

### Fragment Naming

It's a good practice to name fragment bundles in a way that clearly indicates their host bundle. For example, if the host bundle is `@example/host`, the fragment bundle could be named `@example/host-fragment`.

### Version Ranges

When specifying a version range in the `fragmentHost` header, be as specific as possible to avoid attaching to incompatible versions of the host bundle.

### Component Design

Design your components with fragments in mind. If a component might be extended by fragments, make sure it's designed to handle additional resources or services.

### Testing

Test your host bundle both with and without its fragments to ensure it works correctly in both scenarios.

## Conclusion

The Fragment Pattern is a powerful way to extend and customize bundles without modifying their original source code. It enables modular development and deployment of features, translations, themes, and platform-specific implementations.

By leveraging fragments, you can create more flexible and maintainable applications that can be easily extended and customized for different environments and use cases.
