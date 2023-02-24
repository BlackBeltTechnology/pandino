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

### PandinoProvider

In order for hooks provided by this library to work, as a first step we must initialize the `PandinoProvider`:

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

### useBundleContext

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

### useTrackService

This is a simple hook which expects a `filter` parameter and returns a Service or `undefined`.

When a service is removed from the system or if is not present to begin with, the hook will trigger the component and
the returned value will be `undefined`.

Developers **MUST** handle the undefined scenarios explicitly.

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

### useTrackComponent

This hook works similarly to `useTrackService`, the only difference is that it handles React components. 

Component contract:

```typescript jsx
import type { FC } from 'react';
export const CUSTOM_COMPONENT_INTERFACE_KEY = '@some-scope/component-api/CustomComponent';

export interface CustomComponent extends FC<ComponentProps> {}

export interface ComponentProps {
  firstName: string;
  lastName?: string;
}
```

Component implementation:

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

Component registration:

```typescript jsx
import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import type { CustomComponent } from '@some-scope/component-api';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@some-scope/component-api';
import { ComponentOne } from './ComponentOne';

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

Consumer app:

```typescript jsx
import type { FC } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { useTrackComponent } from '@pandino/react-hooks';
import type { CustomComponent } from '@some-scope/component-api';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@some-scope/component-api';

export const MyComponent: FC = () => {
    const ExternalComponent = useTrackComponent<CustomComponent>(`(${OBJECTCLASS}=${CUSTOM_COMPONENT_INTERFACE_KEY})`);

    if (ExternalComponent) {
        return <ExternalComponent {...someProps} />;
    }

    return <>fallback content</>;
};
```

### ComponentProxy

The `ComponentProxy` component can be used as a wrapper which has a `filter` prop, and renders the corresponding
component if found. Otherwise it renders it's children.

> In essence it is a shorthand / syntax sugar for `useTrackComponent`

```typescript jsx
import type { FC } from 'react';
import { useState } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { ComponentProxy } from '@pandino/react-hooks';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@some-scope/component-api';

export const App: FC = () => {
  const [firstName] = useState<string>('John');

  return (
    <ComponentProxy filter={`(${OBJECTCLASS}=${CUSTOM_COMPONENT_INTERFACE_KEY})`} firstName={firstName}>
      <div className={'fallback'}>fallback for: {firstName}</div>
    </ComponentProxy>
  );
};
```

All props are passed to the found component except `filter`.

Prop matching between desired component props and children are not ensured.

> This component (currently) cannot validate props!

## License

Eclipse Public License - v 2.0
