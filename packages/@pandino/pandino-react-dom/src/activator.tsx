import { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino-api';
import { REACT_DOM_APPLICATION_OBJECT_CLASS, REACT_DOM_ELEMENT_SELECTOR } from '@pandino/pandino-react-dom-api';
import React from 'react';
import ReactDOM from 'react-dom';
import { registerReactServices } from './register-react-services';
import { ReactWrapper } from './ReactWrapper';

export class Activator implements BundleActivator {
  private rootElement?: HTMLElement;
  private applicationObjectClass?: string;
  private serviceRegistrations: ServiceRegistration<any>[] = [];

  start(context: BundleContext): Promise<void> {
    const rootSelector = context.getProperty(REACT_DOM_ELEMENT_SELECTOR);
    this.rootElement = document.querySelector(rootSelector);
    this.applicationObjectClass = context.getProperty(REACT_DOM_APPLICATION_OBJECT_CLASS);

    this.serviceRegistrations = registerReactServices(context);

    console.log(this.serviceRegistrations);

    this.render(context);

    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    this.serviceRegistrations.forEach((reg) => reg.unregister());
    this.rootElement.innerHTML = '';

    return Promise.resolve();
  }

  private render(context: BundleContext): void {
    ReactDOM.render(
      <React.StrictMode>
        <ReactWrapper context={context} applicationObjectClass={this.applicationObjectClass} />
      </React.StrictMode>,
      this.rootElement,
    );
  }
}
