// oxlint-disable-next-line no-useless-empty-export
export {} from 'reflect-metadata';

// Framework exports
export { OSGiFramework } from './framework/framework';
export { OSGiBootstrap } from './framework/bootstrap';
export type { BootstrapConfig } from './framework/bootstrap-config';

// Interface exports
export type {
  Bundle,
  BundleActivator,
  BundleContext,
  BundleListener,
  ServiceListener,
  ServiceReference,
  ServiceRegistration,
  ServiceFactory,
  Filter,
} from './framework/interfaces';
export * from './services/service-tracker/interfaces';
export { ServiceTracker } from './services/service-tracker/index';

// Event exports
export { BundleEvent, ServiceEvent } from './framework/interfaces';

// Type exports
export type { BundleMetadata, BundleModule } from './types/bundle-metadata';
export { BUNDLE_STATES, SERVICE_EVENT_TYPES } from './types/constants';

// Declarative Services exports
export {
  Component,
  Service,
  Reference,
  Property,
  Activate,
  Deactivate,
  Modified,
  ConfigurationPolicy,
} from './services/declarative-services/interfaces';
export type {
  ComponentContext,
  ComponentDescriptor,
  ReferenceDescriptor,
  ServiceDescriptor,
} from './services/declarative-services/interfaces';
export { ServiceComponentRuntime } from './services/declarative-services/scr';

// Service exports
export { LogLevel } from './services/log-service/interfaces';
export type { LogService } from './services/log-service/interfaces';
