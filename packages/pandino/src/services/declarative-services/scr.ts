import type {
  Bundle,
  BundleContext,
  ServiceFactory,
  ServiceReference,
  ServiceRegistration,
} from '~/framework/interfaces';
import { ComponentContextImpl } from './component-context';
import type { ComponentContext, ComponentDescriptor, ReferenceDescriptor } from './interfaces';
import type { ConfigurationAdmin } from '~/services/config-admin';

interface ComponentEntry {
  instance: any;
  metadata: ComponentDescriptor;
  serviceRegistration?: ServiceRegistration<any>;
  factoryInstances?: Map<string, any>;
  context?: ComponentContext;
  bundleInstances?: Map<number, any>; // For bundle-scoped services
}

class PrototypeServiceFactory implements ServiceFactory<any> {
  constructor(
    private ComponentClass: any,
    private metadata: ComponentDescriptor,
    private scr: ServiceComponentRuntime,
  ) {}

  getService(bundle: Bundle, registration: ServiceRegistration<any>): any {
    const instance = new this.ComponentClass();

    const context = new ComponentContextImpl(
      bundle.getContext(),
      this.metadata.properties || {},
      registration.getReference(),
      this.metadata.name,
      this.scr,
    );

    if (this.metadata.activate) {
      try {
        instance[this.metadata.activate](context);
      } catch (error) {
        console.error(`Failed to activate prototype instance: ${error}`);
        throw error;
      }
    }

    this.satisfyInstanceReferences(instance);

    // Return a proxy that forces the framework to not cache this instance
    // by making each call return a different object reference
    return new Proxy(instance, {
      get(target, prop, receiver) {
        // Add a unique identifier to prevent caching
        if (prop === Symbol.toPrimitive || prop === 'valueOf' || prop === 'toString') {
          return () => `PrototypeInstance_${Date.now()}_${Math.random()}`;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  ungetService(_bundle: Bundle, _registration: ServiceRegistration<any>, service: any): void {
    // For prototype scope, immediately deactivate the instance
    if (this.metadata.deactivate && typeof service[this.metadata.deactivate] === 'function') {
      try {
        service[this.metadata.deactivate]();
      } catch (error) {
        console.error(`Failed to deactivate prototype instance: ${error}`);
      }
    }
  }

  private satisfyInstanceReferences(instance: any): void {
    for (const ref of this.metadata.references || []) {
      try {
        this.scr.satisfyReferenceForInstance(instance, ref);
      } catch (error) {
        console.error(`Failed to satisfy reference ${ref.interface} for prototype instance: ${error}`);
      }
    }
  }
}

class BundleScopeServiceFactory implements ServiceFactory<any> {
  constructor(
    private ComponentClass: any,
    private metadata: ComponentDescriptor,
    private scr: ServiceComponentRuntime,
    private componentEntry: ComponentEntry,
  ) {}

  getService(bundle: Bundle, registration: ServiceRegistration<any>): any {
    const bundleId = bundle.getBundleId();

    if (!this.componentEntry.bundleInstances) {
      this.componentEntry.bundleInstances = new Map();
    }

    let instance = this.componentEntry.bundleInstances.get(bundleId);
    if (instance) {
      return instance;
    }

    instance = new this.ComponentClass();
    this.componentEntry.bundleInstances.set(bundleId, instance);

    const context = new ComponentContextImpl(
      bundle.getContext(),
      this.metadata.properties || {},
      registration.getReference(),
      this.metadata.name,
      this.scr,
    );

    if (this.metadata.activate) {
      try {
        instance[this.metadata.activate](context);
      } catch (error) {
        console.error(`Failed to activate bundle-scoped instance: ${error}`);
        throw error;
      }
    }

    this.satisfyInstanceReferences(instance);

    return instance;
  }

  ungetService(_bundle: Bundle, _registration: ServiceRegistration<any>, _service: any): void {
    // For bundle scope, we don't immediately deactivate on unget
    // The instance stays alive until the bundle stops or component is deactivated
  }

  private satisfyInstanceReferences(instance: any): void {
    for (const ref of this.metadata.references || []) {
      try {
        this.scr.satisfyReferenceForInstance(instance, ref);
      } catch (error) {
        console.error(`Failed to satisfy reference ${ref.interface} for bundle-scoped instance: ${error}`);
      }
    }
  }
}

export class ServiceComponentRuntime {
  private components = new Map<string, ComponentEntry>();
  private readonly bundleContext: BundleContext;
  private bundleComponents = new Map<number, Set<string>>();
  private readonly configAdmin!: ConfigurationAdmin | null;

  constructor(
    private framework: any,
    bundleContext: BundleContext,
  ) {
    this.bundleContext = bundleContext;

    const configAdminRefs = this.bundleContext.getServiceReferences('ConfigurationAdmin');
    if (configAdminRefs && configAdminRefs.length > 0) {
      this.configAdmin = this.bundleContext.getService<ConfigurationAdmin>(configAdminRefs[0]);
    }
  }

  async registerComponent(component: any) {
    const metadata = (component as any).__osgi_component__;
    if (!metadata) {
      throw new Error('Component metadata not found');
    }
    this.components.set(metadata.name, {
      instance: null,
      metadata: { ...metadata, class: component },
    });

    // For immediate components, check if they can be activated
    if (metadata.immediate) {
      await this.tryActivateImmediate(metadata.name);
    }
  }

  /**
   * Attempts to activate an immediate component if all requirements are met
   * according to OSGi SCR specification
   */
  private async tryActivateImmediate(name: string): Promise<void> {
    try {
      // Check if component can be activated (all mandatory references satisfied)
      if (await this.canActivateComponent(name)) {
        await this.activateComponent(name);
      }
      // If not ready yet, it will be activated later when dependencies become available
    } catch (error) {
      // Immediate components that fail to activate should log but not throw
      console.warn(`Failed to activate immediate component ${name}: ${error}`);
    }
  }

  /**
   * Checks if a component can be activated according to OSGi SCR rules
   */
  private async canActivateComponent(name: string): Promise<boolean> {
    const entry = this.components.get(name);
    if (!entry) {
      return false;
    }

    const { metadata } = entry;

    // Check configuration policy
    if (metadata.configurationPolicy === 'require' && !this.hasConfiguration(metadata.configurationPid)) {
      return false;
    }

    // Check if all mandatory references are satisfied
    for (const ref of metadata.references || []) {
      const cardinality = ref.cardinality || '0..1';

      if (cardinality === '1..1' || cardinality === '1..n') {
        const filter = ref.target || null;
        const serviceRefs = this.bundleContext.getServiceReferences(ref.interface, filter) ?? [];

        if (serviceRefs.length === 0) {
          return false; // Mandatory reference not satisfied
        }
      }
    }

    return true;
  }

  getComponent(name: string) {
    return this.components.get(name);
  }

  async activateComponent(name: string) {
    const entry = this.components.get(name);
    if (!entry) {
      throw new Error(`Component ${name} not found`);
    }

    const { metadata } = entry;

    if (metadata.configurationPolicy === 'require' && !this.hasConfiguration(metadata.configurationPid)) {
      return;
    }

    const ComponentClass = metadata.class || metadata;

    if (typeof ComponentClass !== 'function') {
      throw new Error(`Component ${name} does not have a valid constructor`);
    }

    const scope = metadata.service?.scope || 'singleton';

    if (scope === 'prototype') {
      // For prototype scope, we don't create an instance here
      // Instead, we register a service factory that creates instances on demand
      entry.instance = null; // No single instance for prototype

      if (metadata.service?.interfaces && metadata.service.interfaces.length > 0) {
        const serviceProps = {
          ...metadata.properties,
          'service.scope': 'prototype', // Mark as prototype to prevent caching
        };
        const factory = new PrototypeServiceFactory(ComponentClass, metadata, this);

        entry.serviceRegistration = this.bundleContext.registerService(
          metadata.service.interfaces,
          factory,
          serviceProps,
        );
      }
    } else if (scope === 'bundle') {
      // For bundle scope, create a service factory that manages per-bundle instances
      entry.instance = null; // No single instance for bundle scope

      if (metadata.service?.interfaces && metadata.service.interfaces.length > 0) {
        const serviceProps = { ...metadata.properties };
        const factory = new BundleScopeServiceFactory(ComponentClass, metadata, this, entry);

        entry.serviceRegistration = this.bundleContext.registerService(
          metadata.service.interfaces,
          factory,
          serviceProps,
        );
      }
    } else {
      // Singleton scope (default) - create single instance
      const instance = new ComponentClass();
      entry.instance = instance;

      if (metadata.service?.interfaces && metadata.service.interfaces.length > 0) {
        const serviceProps = { ...metadata.properties };
        entry.serviceRegistration = this.bundleContext.registerService(
          metadata.service.interfaces,
          instance,
          serviceProps,
        );
      }

      const serviceRef = entry.serviceRegistration?.getReference() || null;
      const context = new ComponentContextImpl(
        this.bundleContext,
        metadata.properties || {},
        serviceRef,
        metadata.name,
        this,
      );
      entry.context = context;

      if (metadata.activate) {
        try {
          await instance[metadata.activate](context);
        } catch (error) {
          if (entry.serviceRegistration) {
            entry.serviceRegistration.unregister();
            entry.serviceRegistration = undefined;
          }
          entry.instance = null;
          throw error;
        }
      }

      await this.satisfyReferences(name);
    }

    if (metadata.factory) {
      entry.factoryInstances = new Map();
    }
  }

  async deactivateComponent(name: string) {
    const entry = this.components.get(name);
    if (!entry || (!entry.instance && !entry.bundleInstances)) {
      throw new Error(`Component ${name} not active`);
    }

    const { metadata, context } = entry;

    if (entry.factoryInstances) {
      for (const [_instanceName, factoryInstance] of entry.factoryInstances.entries()) {
        try {
          if (metadata.deactivate && typeof factoryInstance[metadata.deactivate] === 'function') {
            await factoryInstance[metadata.deactivate](context);
          }
          // oxlint-disable-next-line no-unused-vars
        } catch (error) {}
      }
      entry.factoryInstances.clear();
    }

    if (entry.bundleInstances) {
      for (const [_bundleId, bundleInstance] of entry.bundleInstances.entries()) {
        try {
          if (metadata.deactivate && typeof bundleInstance[metadata.deactivate] === 'function') {
            await bundleInstance[metadata.deactivate](context);
          }
          // oxlint-disable-next-line no-unused-vars
        } catch (error) {}
      }
      entry.bundleInstances.clear();
    }

    if (entry.instance && metadata.deactivate) {
      try {
        await entry.instance[metadata.deactivate](context);
        // oxlint-disable-next-line no-unused-vars
      } catch (error) {}
    }

    if (entry.serviceRegistration) {
      try {
        entry.serviceRegistration.unregister();
        // oxlint-disable-next-line no-unused-vars
      } catch (error) {}
      entry.serviceRegistration = undefined;
    }

    entry.instance = null;
    entry.context = undefined;
  }

  async satisfyReferences(name: string) {
    const entry = this.components.get(name);
    if (!entry || !entry.instance) {
      throw new Error(`Component ${name} not active`);
    }

    const { instance, metadata } = entry;
    for (const ref of metadata.references || []) {
      await this.satisfyReference(instance, ref);
    }
  }

  private async satisfyReference(instance: any, ref: ReferenceDescriptor) {
    const filter = ref.target || null;

    const serviceRefs = this.bundleContext.getServiceReferences(ref.interface, filter) ?? [];

    const cardinality = ref.cardinality || '0..1';

    if (cardinality === '1..1' || cardinality === '0..1') {
      if (serviceRefs.length > 0) {
        const service = this.bundleContext.getService(serviceRefs[0]);
        if (service) {
          if (ref.bind) {
            instance[ref.bind](service);
          }

          if (ref.field) {
            instance[ref.field] = service;
          }
        }
      } else if (cardinality === '1..1') {
        throw new Error(`Mandatory reference ${ref.interface} not satisfied`);
      }
    } else {
      const services = serviceRefs.map((ref) => this.bundleContext.getService(ref)).filter(Boolean);

      if (services.length === 0 && cardinality === '1..n') {
        throw new Error(`Mandatory reference ${ref.interface} not satisfied`);
      }

      if (ref.bind) {
        for (const service of services) {
          instance[ref.bind](service);
        }
      }

      if (ref.field) {
        if (ref.fieldOption === 'replace' || !ref.fieldOption) {
          instance[ref.field] = services;
        } else if (ref.fieldOption === 'update' && Array.isArray(instance[ref.field])) {
          instance[ref.field] = [...instance[ref.field], ...services];
        }
      }
    }
  }

  async processServiceEvent(interfaceName: string, eventType: string, serviceRef?: ServiceReference<any>) {
    // First handle existing active components
    for (const [_name, entry] of this.components.entries()) {
      const { instance, metadata } = entry;
      if (!instance) continue;

      for (const ref of metadata.references || []) {
        if (ref.interface === interfaceName) {
          if (eventType === 'registered' && ref.bind && serviceRef) {
            const service = this.bundleContext.getService(serviceRef);
            if (service) {
              instance[ref.bind](service);

              if (ref.field && ref.fieldOption === 'update') {
                if (ref.cardinality === '1..1' || ref.cardinality === '0..1') {
                  instance[ref.field] = service;
                } else if (Array.isArray(instance[ref.field])) {
                  instance[ref.field] = [...instance[ref.field], service];
                }
              }
            }
          } else if (eventType === 'unregistered' && ref.unbind) {
            instance[ref.unbind]();

            if (ref.field) {
              if (ref.cardinality === '1..1' || ref.cardinality === '0..1') {
                instance[ref.field] = null;
              } else if (Array.isArray(instance[ref.field])) {
                instance[ref.field] = [];
              }
            }
          } else if (eventType === 'modified' && ref.updated && serviceRef) {
            const service = this.bundleContext.getService(serviceRef);
            if (service) {
              instance[ref.updated](service);
            }
          }
        }
      }
    }

    // After handling existing components, check if any immediate components can now be activated
    if (eventType === 'registered') {
      await this.checkPendingImmediateComponents();
    }
  }

  /**
   * Checks all registered immediate components that are not yet active
   * and tries to activate them if their dependencies are now satisfied
   */
  private async checkPendingImmediateComponents(): Promise<void> {
    for (const [name, entry] of this.components.entries()) {
      const { metadata, instance } = entry;

      // Only check immediate components that are not yet active
      if (metadata.immediate && !instance) {
        await this.tryActivateImmediate(name);
      }
    }
  }

  async createFactoryInstance(factoryName: string, instanceName: string, configuration: Record<string, any> = {}) {
    const factoryComponent = Array.from(this.components.values()).find(
      (entry) => entry.metadata.factory === factoryName,
    );

    if (!factoryComponent) {
      throw new Error(`Factory component with factory ID ${factoryName} not found`);
    }

    const { metadata } = factoryComponent;
    const ComponentClass = metadata.class;

    if (!factoryComponent.factoryInstances) {
      factoryComponent.factoryInstances = new Map();
    }

    const instance = new ComponentClass(configuration);

    const context = new ComponentContextImpl(
      this.bundleContext,
      { ...metadata.properties, ...configuration },
      null,
      `${metadata.name}.${instanceName}`,
      this,
    );

    if (metadata.activate && typeof instance[metadata.activate] === 'function') {
      await instance[metadata.activate](context);
    }

    factoryComponent.factoryInstances.set(instanceName, {
      instance,
      configuration,
    });

    return instance;
  }

  async deleteFactoryInstance(factoryName: string, instanceName: string) {
    const factoryComponent = Array.from(this.components.values()).find(
      (entry) => entry.metadata.factory === factoryName,
    );

    if (!factoryComponent || !factoryComponent.factoryInstances) {
      throw new Error(`Factory component with factory ID ${factoryName} not found or not active`);
    }

    const instanceData = factoryComponent.factoryInstances.get(instanceName);
    if (!instanceData) {
      throw new Error(`Factory instance ${instanceName} not found`);
    }

    const { instance, configuration } = instanceData;
    const { metadata } = factoryComponent;

    const context = new ComponentContextImpl(
      this.bundleContext,
      { ...metadata.properties, ...configuration },
      null,
      `${metadata.name}.${instanceName}`,
      this,
    );

    if (metadata.deactivate && typeof instance[metadata.deactivate] === 'function') {
      try {
        await instance[metadata.deactivate](context);
      } catch (error) {
        console.error(`Error during deactivation of factory instance ${instanceName}:`, error);
      }
    }

    factoryComponent.factoryInstances.delete(instanceName);
  }

  async updateComponentConfiguration(name: string, configuration: Record<string, any>) {
    const entry = this.components.get(name);
    if (!entry || !entry.instance) {
      throw new Error(`Component ${name} not active`);
    }

    const { instance, metadata, context } = entry;

    if (context) {
      (context as any).properties = { ...metadata.properties, ...configuration };
    }

    if (metadata.modified && typeof instance[metadata.modified] === 'function') {
      await instance[metadata.modified](configuration, context);
    }
  }

  private hasConfiguration(configPid?: string): boolean {
    if (!configPid) {
      return true; // No configuration PID specified, so no configuration required
    }

    if (!this.configAdmin) {
      return false; // Configuration required but no ConfigAdmin available
    }

    // TODO: In a real implementation, this would check with ConfigAdmin
    // For now, return false to properly handle 'require' policy
    // This should be implemented to actually check for configuration existence
    return false;
  }

  satisfyReferenceForInstance(instance: any, ref: ReferenceDescriptor) {
    const filter = ref.target || null;
    const serviceRefs = this.bundleContext.getServiceReferences(ref.interface, filter) ?? [];
    const cardinality = ref.cardinality || '0..1';

    if (cardinality === '1..1' || cardinality === '0..1') {
      if (serviceRefs.length > 0) {
        const service = this.bundleContext.getService(serviceRefs[0]);
        if (service) {
          if (ref.bind) {
            instance[ref.bind](service);
          }
          if (ref.field) {
            instance[ref.field] = service;
          }
        }
      } else if (cardinality === '1..1') {
        throw new Error(`Mandatory reference ${ref.interface} not satisfied`);
      }
    } else {
      const services = serviceRefs.map((ref) => this.bundleContext.getService(ref)).filter(Boolean);

      if (services.length === 0 && cardinality === '1..n') {
        throw new Error(`Mandatory reference ${ref.interface} not satisfied`);
      }

      if (ref.bind) {
        for (const service of services) {
          instance[ref.bind](service);
        }
      }

      if (ref.field) {
        if (ref.fieldOption === 'replace' || !ref.fieldOption) {
          instance[ref.field] = services;
        } else if (ref.fieldOption === 'update' && Array.isArray(instance[ref.field])) {
          instance[ref.field] = [...instance[ref.field], ...services];
        }
      }
    }
  }
}
