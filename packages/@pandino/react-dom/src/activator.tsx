import { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import { REACT_DOM_APPLICATION_OBJECT_CLASS, REACT_DOM_ELEMENT_SELECTOR } from '@pandino/react-dom-api';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerReactServices } from './register-react-services';
import { ReactWrapper } from './ReactWrapper';

export class Activator implements BundleActivator {
  private rootElement?: HTMLElement;
  private applicationObjectClass?: string;
  private serviceRegistrations: ServiceRegistration<any>[] = [];

  async start(context: BundleContext): Promise<void> {
    const rootSelector = context.getProperty(REACT_DOM_ELEMENT_SELECTOR);
    this.rootElement = document.querySelector(rootSelector);
    this.applicationObjectClass = context.getProperty(REACT_DOM_APPLICATION_OBJECT_CLASS);

    this.serviceRegistrations = registerReactServices(context);

    this.render(context);
  }

  async stop(context: BundleContext): Promise<void> {
    this.serviceRegistrations.forEach((reg) => reg.unregister());
    this.rootElement.innerHTML = '';
  }

  private render(context: BundleContext): void {
    // FIXME: update when typedefs are updated...
    const root = createRoot(this.rootElement);
    root.render(
      <React.StrictMode>
        <ReactWrapper context={context} applicationObjectClass={this.applicationObjectClass} />
      </React.StrictMode>,
    );
  }
}
