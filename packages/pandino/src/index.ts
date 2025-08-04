// oxlint-disable-next-line no-useless-empty-export
export {} from 'reflect-metadata';
export { OSGiFramework } from './framework/framework';
export { OSGiBootstrap } from './framework/bootstrap';
export type { BootstrapConfig } from './framework/bootstrap-config';
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
export type {
  Configuration,
  ConfigurationAdmin,
  ManagedService,
  ManagedServiceFactory,
  ConfigurationEvent,
  ConfigurationListener,
} from './services/config-admin/interfaces';
export { ConfigurationEventType } from './services/config-admin/interfaces';
export { BundleEvent, ServiceEvent } from './framework/interfaces';
export type { BundleMetadata, BundleModule } from './types/bundle-metadata';
export { BUNDLE_STATES, SERVICE_EVENT_TYPES } from './types/constants';
export type { ComponentContext } from './services/declarative-services/interfaces';
export { ServiceComponentRuntime } from './services/declarative-services/scr';
export { getDecoratorInfo } from './services/declarative-services/reflection';
export { LogLevel } from './services/log-service/interfaces';
export type { LogService } from './services/log-service/interfaces';
export { type EventHandler, Event, type EventAdmin } from './services/event-admin/interfaces';
