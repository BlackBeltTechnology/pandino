# react-hooks

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Conventional Changelog](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat)](https://github.com/conventional-changelog/conventional-changelog)

A Pandino library providing handy tools for React-based applications.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Usage

### Add PandinoProvider to your app


```typescript jsx
import { createRoot } from 'react-dom/client';
import Pandino from '@pandino/pandino';
import loaderConfiguration from '@pandino/loader-configuration-dom';
import { PandinoProvider } from '@pandino/react-hooks';

const root = createRoot(document.querySelector('#root')!);

const pandino = new Pandino({
  ...loaderConfiguration,
});

await pandino.init();
await pandino.start();

// FYI: PandinoProvider's `ctx` prop expects any BundleContext instance, it doesn't need to be the system bundle's context. 
root.render(
  <PandinoProvider ctx={pandino.getBundleContext()}>
    <YourAppHere />
  </PandinoProvider>,
);

```

### Hooks

#### useBundleContext

Use this hook to obtain the `BundleContext` reference registered with `PandinoProvider`

```typescript jsx
import type { FC } from 'react';
import { useBundleContext } from '@pandino/react-hooks';

export const MyComponent: FC = () => {
    const { bundleContext } = useBundleContext();
    
    console.log(bundleContext);
    
    // ...
};
```

#### useTrackService

This is a simple hook which expects a `filter` parameter and return a Service or `undefined`.

When a service is removed from the system or if is not present to begin with, the hook will trigger the component and
the returned value will be `undefined`.

```typescript jsx
import type { FC } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { useTrackService } from '@pandino/react-hooks';

export const MyComponent: FC = () => {
    const { service: serviceImpl } = useTrackService<ServiceInterface>(`(${OBJECTCLASS}=${SERVICE_INTERFACE_KEY})`);
    
    serviceImpl?.someMethod(); // Notice the usage of `?`
    
    // ...
};
```

#### useTrackComponent

This hook works similarly to `useTrackService`, the only difference is that it handles React components. 

**component contract:**

```typescript jsx
export const CUSTOM_COMPONENT_INTERFACE_KEY = '@some-scope/component-api/CustomComponent';

export interface CustomComponent extends FC<ComponentProps> {}

export interface ComponentProps {
  firstName: string;
  lastName?: string;
}
```

**component implementation:**

```typescript jsx
import { useState } from 'react';
import type { CustomComponent } from '@some-scope/component-api';

export const ComponentOne: CustomComponent = (props) => {
    const [data, setData] = useState<{ firstName: string; lastName?: string }>({ ...props });

    return (
        <div className="component-one" style={{ border: '1px solid black', padding: '1rem' }}>
            <h3>Component One</h3>
            <p>FirstName: {data.firstName}</p>
            <p>LastName: {data.lastName}</p>
        </div>
    );
};
```

**component registration:**

```typescript jsx
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import type { CustomComponent } from '@some-scope/component-api';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from './contract';

export default class SomeActivator implements BundleActivator {
  private reg?: ServiceRegistration<CustomComponent>;

  async start(context: BundleContext) {
    this.reg = context.registerService<CustomComponent>(CUSTOM_COMPONENT_INTERFACE_KEY, ComponentOne);
  }

  async stop(context: BundleContext) {
    this.reg?.unregister();
  }
}
```

**consumer app:**

```typescript jsx
import type { FC } from 'react';
import { useTrackComponent } from '@pandino/react-hooks';
import type { CustomComponent } from '@some-scope/component-api';

export const MyComponent: FC = () => {
    const ExternalComponent = useTrackComponent<CustomComponent>(COMPONENT_FILTER_HERE);

    if (ExternalComponent) {
        return <ExternalComponent {...someProps} />;
    }

    return <>fallback content</>;
};
```

## License

Eclipse Public License - v 2.0
