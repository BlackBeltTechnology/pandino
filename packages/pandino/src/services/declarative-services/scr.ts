import type { BundleContext, ServiceReference } from '../../framework/interfaces';
import { ComponentContextImpl } from './component-context';
import { getComponentMetadata, getDecoratorInfo } from './reflection';
import type { ConfigurationAdmin } from '../config-admin';
import type { ReferenceDescriptor } from '@pandino/decorators';
import type { ComponentEntry } from './interfaces';
import { OSGiFramework } from '../../framework/framework';
import { Event } from '../event-admin';
import type { EventAdmin } from '../event-admin';
import { PrototypeServiceFactory } from './service-factories/PrototypeServiceFactory';
import { BundleScopeServiceFactory } from './service-factories/BundleScopeServiceFactory';

export class ServiceComponentRuntime {
  // Map of bundle ID -> component name -> component entry
  private components = new Map<number, Map<string, ComponentEntry>>();
  private readonly bundleContext: BundleContext;
  private readonly configAdmin!: ConfigurationAdmin | null;
  private readonly eventAdmin!: EventAdmin | null;
  private activationChain: string[] = [];
  private resolving = false;

  private removeFromActivationChain(componentId: string): void {
    const index = this.activationChain.indexOf(componentId);
    if (index !== -1) {
      this.activationChain.splice(index, 1);
    }
  }

  constructor(
    private framework: OSGiFramework,
    bundleContext: BundleContext,
  ) {
    this.bundleContext = bundleContext;

    const configAdminRefs = this.bundleContext.getServiceReferences('ConfigurationAdmin');
    if (configAdminRefs && configAdminRefs.length > 0) {
      this.configAdmin = this.bundleContext.getService<ConfigurationAdmin>(configAdminRefs[0]);
    }

    const eventAdminRefs = this.bundleContext.getServiceReferences('EventAdmin');
    if (eventAdminRefs && eventAdminRefs.length > 0) {
      this.eventAdmin = this.bundleContext.getService<EventAdmin>(eventAdminRefs[0]);
    } else {
      this.eventAdmin = null;
    }
  }

  async registerComponent(component: any, bundleId?: number) {
    const metadata = getComponentMetadata(component);
    if (!metadata) {
      throw new Error('Component metadata not found');
    }

    // If bundleId is not provided, get it from the current bundle context
    if (bundleId === undefined) {
      bundleId = this.bundleContext.getBundle().getBundleId();
    }

    // Store the bundle ID in the component metadata
    metadata.bundleId = bundleId;

    if (!this.components.has(bundleId)) {
      this.components.set(bundleId, new Map<string, ComponentEntry>());
    }

    const bundleComponents = this.components.get(bundleId)!;
    // Idempotency: avoid duplicate registration of the same component in the same bundle
    if (bundleComponents.has(metadata.name)) {
      return;
    }

    bundleComponents.set(metadata.name, {
      instance: null,
      metadata: { ...metadata, class: component },
    });

    this.publishScrEvent('scr/component/registered', {
      'bundle.id': bundleId,
      'component.name': metadata.name,
      decorators: getDecoratorInfo(component),
    });

    // For immediate components, check if they can be activated
    if (metadata.immediate) {
      await this.tryActivateImmediate(bundleId, metadata.name);
    }
  }

  /**
   * Attempts to activate an immediate component if all requirements are met
   * according to OSGi SCR specification
   */
  private async tryActivateImmediate(bundleId: number, name: string): Promise<void> {
    try {
      // Check if component can be activated (all mandatory references satisfied)
      if (await this.canActivateComponent(bundleId, name)) {
        await this.activateComponent(bundleId, name);
      }
      // If not ready yet, it will be activated later when dependencies become available
    } catch (error) {
      // Immediate components that fail to activate should log but not throw
      this.framework
        .getLogger()
        .warn(`Failed to activate immediate component ${name} from bundle ${bundleId}: ${error}`, error as Error);
    }
  }

  /**
   * Checks if a component can be activated according to OSGi SCR rules
   */
  private async canActivateComponent(bundleId: number, name: string): Promise<boolean> {
    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      return false;
    }

    const entry = bundleComponents.get(name);
    if (!entry) {
      return false;
    }

    const { metadata } = entry;

    // Check configuration policy
    if (metadata.configurationPolicy === 'require' && !(await this.hasConfiguration(metadata.configurationPid))) {
      return false;
    }

    // Check if all mandatory references are satisfied
    for (const ref of metadata.references || []) {
      const cardinality = ref.cardinality || '0..1';

      if (cardinality === '1..1' || cardinality === '1..n') {
        const filter = ref.target || null;
        const scrBundleId = this.bundleContext.getBundle().getBundleId();
        const componentCtx =
          bundleId === scrBundleId
            ? this.bundleContext
            : this.framework.getBundle(bundleId)?.getContext() || this.bundleContext;
        const serviceRefs = componentCtx.getServiceReferences(ref.interface, filter) ?? [];

        if (serviceRefs.length === 0) {
          return false; // Mandatory reference not satisfied
        }
      }
    }

    return true;
  }

  getFramework(): OSGiFramework {
    return this.framework;
  }

  getComponent(bundleId: number, name: string): ComponentEntry | undefined {
    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      return undefined;
    }
    return bundleComponents.get(name);
  }

  private publishScrEvent(topic: string, properties: Record<string, any>): void {
    if (!this.eventAdmin) return;
    try {
      this.eventAdmin.postEvent(new Event(topic, properties));
    } catch (e) {
      this.framework.getLogger().error(`Failed to publish SCR event ${topic}:`, e as Error);
    }
  }

  async activateComponent(bundleId: number, name: string): Promise<void> {
    let entry: ComponentEntry | undefined;
    const componentId = `${bundleId}:${name}`;

    let bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      // Create an empty bundle entry if it doesn't exist
      bundleComponents = new Map<string, ComponentEntry>();
      this.components.set(bundleId, bundleComponents);
    }

    entry = bundleComponents.get(name);
    if (!entry) {
      throw new Error(`Component ${name} not found in bundle ${bundleId}`);
    }

    if (this.activationChain.includes(componentId)) {
      this.framework
        .getLogger()
        .error(`Circular reference detected: ${this.activationChain.join(' -> ')} -> ${componentId}`);
      return;
    }

    this.activationChain.push(componentId);

    const { metadata } = entry;

    if (metadata.configurationPolicy === 'require' && !(await this.hasConfiguration(metadata.configurationPid))) {
      return;
    }

    const ComponentClass = metadata.class || metadata;

    if (typeof ComponentClass !== 'function') {
      const componentName = metadata.name;
      throw new Error(`Component ${componentName} does not have a valid constructor`);
    }

    const scope = metadata.service?.scope || 'singleton';

    // Use the component's own BundleContext (not SCR's) for registration and lookups
    const componentBundleContext = this.framework.getBundle(bundleId)?.getContext() || this.bundleContext;

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

        entry.serviceRegistration = componentBundleContext.registerService(
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

        entry.serviceRegistration = componentBundleContext.registerService(
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
        entry.serviceRegistration = componentBundleContext.registerService(
          metadata.service.interfaces,
          instance,
          serviceProps,
        );
      }

      const serviceRef = entry.serviceRegistration?.getReference() || null;
      const context = new ComponentContextImpl(
        componentBundleContext,
        metadata.properties || {},
        serviceRef,
        metadata.name,
        this,
      );
      entry.context = context;

      // Bind/satisfy references before invoking @Activate so injected fields are available during activation.
      this.satisfyReferences(bundleId, name, true);

      // Invoke @Activate if present; otherwise, fall back to a conventional 'activate' method if it exists.
      const activateMethodName =
        metadata.activate || (typeof (instance as any)['activate'] === 'function' ? 'activate' : null);
      if (activateMethodName) {
        try {
          await (instance as any)[activateMethodName](context);
        } catch (error) {
          if (entry.serviceRegistration) {
            entry.serviceRegistration.unregister();
            entry.serviceRegistration = undefined;
          }
          entry.instance = null;
          throw error;
        }
      }

      // For dynamic references, perform additional passes to allow late availability
      const hasDynamicRefs = (metadata.references || []).some((r) => (r.policy || 'static') === 'dynamic');
      if (hasDynamicRefs) {
        // Second pass: bind any references (especially dynamic) now that activation completed
        this.satisfyReferences(bundleId, name);
      }
    }

    if (metadata.factory) {
      entry.factoryInstances = new Map();
    }

    this.publishScrEvent('scr/component/activated', {
      'bundle.id': bundleId,
      'component.name': metadata.name,
      decorators: getDecoratorInfo(metadata.class || ComponentClass),
    });

    this.removeFromActivationChain(componentId);

    // Activating this component may have registered a service that satisfies
    // the mandatory references of previously-registered immediate components
    // that could not activate yet (registration-order independence, #297).
    await this.resolvePendingImmediateComponents();
  }

  /**
   * Re-attempts activation of every immediate component whose mandatory
   * references were unsatisfied at registration time. Loops to a fixpoint so
   * activation chains resolve regardless of registration order. Re-entrancy is
   * guarded so nested activations do not restart the scan.
   */
  private async resolvePendingImmediateComponents(): Promise<void> {
    if (this.resolving) {
      return;
    }
    this.resolving = true;
    try {
      // Loop to a fixpoint: each pass activates at most one component, then
      // restarts so newly-registered services cascade to further components.
      while (await this.activateNextSatisfiablePending()) {
        // keep going until a pass makes no progress
      }
    } finally {
      this.resolving = false;
    }
  }

  /**
   * Activates one pending immediate component whose mandatory references are now
   * satisfied and returns true; returns false when none remain. Returning after
   * each activation keeps iteration safe against the component map mutating
   * during activation.
   */
  private async activateNextSatisfiablePending(): Promise<boolean> {
    for (const [bundleId, bundleComponents] of this.components.entries()) {
      for (const [componentName, entry] of bundleComponents.entries()) {
        if (!this.isPendingImmediate(bundleId, componentName, entry)) {
          continue;
        }
        if (await this.canActivateComponent(bundleId, componentName)) {
          await this.activateComponent(bundleId, componentName);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * True when an immediate component is registered but not yet activated and is
   * not already mid-activation. Singleton scope sets `instance`; prototype/bundle
   * scope leaves it null but sets `serviceRegistration` — either means done.
   */
  private isPendingImmediate(bundleId: number, name: string, entry: ComponentEntry): boolean {
    if (!entry.metadata.immediate || entry.instance || entry.serviceRegistration) {
      return false;
    }
    return !this.activationChain.includes(`${bundleId}:${name}`);
  }

  async deactivateComponent(bundleId: number, name: string): Promise<void> {
    let entry: ComponentEntry | undefined;

    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    entry = bundleComponents.get(name);
    if (!entry || (!entry.instance && !entry.bundleInstances)) {
      throw new Error(`Component ${name} not active in bundle ${bundleId}`);
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

    this.publishScrEvent('scr/component/deactivated', {
      'bundle.id': bundleId,
      'component.name': metadata.name,
      decorators: getDecoratorInfo(entry.metadata.class || entry.metadata),
    });
  }

  satisfyReferences(bundleId: number, name: string, initialActivation = false): void {
    let entry: ComponentEntry | undefined;

    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    entry = bundleComponents.get(name);
    if (!entry || !entry.instance) {
      throw new Error(`Component ${name} not active in bundle ${bundleId}`);
    }

    const { instance, metadata } = entry;
    for (const ref of metadata.references || []) {
      this.satisfyReference(instance, ref, initialActivation);
    }
  }

  private satisfyReference(instance: any, ref: ReferenceDescriptor, initialActivation = false) {
    const filter = ref.target || null;

    let componentName: string | undefined;
    let bundleId: number | undefined;

    for (const [currentBundleId, bundleComponents] of this.components.entries()) {
      let found = false;

      for (const [currentName, entry] of bundleComponents.entries()) {
        if (entry.instance === instance) {
          componentName = currentName;
          bundleId = currentBundleId;
          found = true;
          break;
        }
      }

      if (found) break;
    }

    const componentCtx =
      bundleId !== undefined
        ? this.framework.getBundle(bundleId)?.getContext() || this.bundleContext
        : this.bundleContext;
    const serviceRefs = componentCtx.getServiceReferences(ref.interface, filter) ?? [];

    // Check for circular dependencies
    if (componentName && bundleId !== undefined && serviceRefs.length > 0) {
      const componentId = `${bundleId}:${componentName}`;

      // For each service reference, check if it's a component that's currently in the activation chain
      for (const serviceRef of serviceRefs) {
        const serviceComponentName = serviceRef.getProperty('component.name');
        const serviceBundleId = serviceRef.getProperty('component.bundle.id');

        let serviceComponentId: string;
        if (serviceBundleId !== undefined) {
          serviceComponentId = `${serviceBundleId}:${serviceComponentName}`;
        } else {
          // For backward compatibility, if no bundle ID is specified
          serviceComponentId = serviceComponentName as string;
        }

        if (serviceComponentId && this.activationChain.includes(serviceComponentId)) {
          // We found a circular dependency
          const circularChain = [...this.activationChain, componentId, serviceComponentId];
          const errorMessage = `Circular reference detected: ${circularChain.join(' -> ')}. Component '${componentName}' in bundle ${bundleId} has a ${ref.cardinality === '1..1' || ref.cardinality === '1..n' ? 'mandatory' : 'optional'} reference to interface '${ref.interface}' which leads to a circular dependency.`;

          this.framework.getLogger().error(errorMessage);

          // If this is a mandatory reference, we need to fail
          if (ref.cardinality === '1..1' || ref.cardinality === '1..n') {
            throw new Error(errorMessage);
          }

          // For optional references, we can continue but skip this particular reference
          return;
        }
      }
    }

    const cardinality = ref.cardinality || '0..1';

    if (cardinality === '1..1' || cardinality === '0..1') {
      if (serviceRefs.length > 0) {
        const service = componentCtx.getService(serviceRefs[0]);
        if (service) {
          const isMethodField =
            ref.bind && ref.field === ref.bind && typeof (instance as any)[ref.field!] === 'function';
          // Skip duplicate binding if the same service is already assigned to the field
          if (ref.field && !isMethodField && (instance as any)[ref.field] === service) {
            return;
          }
          if (ref.bind && typeof (instance as any)[ref.bind] === 'function') {
            (instance as any)[ref.bind](service);
          }

          if (ref.field && !isMethodField) {
            (instance as any)[ref.field] = service;
          }
        }
      } else if (cardinality === '1..1') {
        const isDynamic = (ref.policy || 'static') === 'dynamic';
        if (initialActivation && isDynamic) {
          return; // allow dynamic mandatory reference to be bound later via events
        }
        throw new Error(`Mandatory reference ${ref.interface} not satisfied`);
      }
    } else {
      const services = serviceRefs.map((ref) => componentCtx.getService(ref)).filter(Boolean);

      if (services.length === 0 && cardinality === '1..n') {
        const isDynamic = (ref.policy || 'static') === 'dynamic';
        if (initialActivation && isDynamic) {
          return; // allow dynamic mandatory references to be satisfied later
        }
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
    for (const [_bundleId, bundleComponents] of this.components.entries()) {
      for (const [_componentName, entry] of bundleComponents.entries()) {
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
    for (const [bundleId, bundleComponents] of this.components.entries()) {
      for (const [componentName, entry] of bundleComponents.entries()) {
        const { metadata, instance } = entry;

        // Only check immediate components that are not yet active
        if (metadata.immediate && !instance) {
          await this.tryActivateImmediate(bundleId, componentName);
        }
      }
    }
  }

  async createFactoryInstance(factoryName: string, instanceName: string, configuration: Record<string, any> = {}) {
    // Find the factory component across all bundles
    let factoryComponent: ComponentEntry | undefined;

    for (const [_bundleId, bundleComponents] of this.components.entries()) {
      for (const [_componentName, entry] of bundleComponents.entries()) {
        if (entry.metadata.factory === factoryName) {
          factoryComponent = entry;
          break;
        }
      }
      if (factoryComponent) break;
    }

    if (!factoryComponent) {
      throw new Error(`Factory component with factory ID ${factoryName} not found in any bundle`);
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
    // Find the factory component across all bundles
    let factoryComponent: ComponentEntry | undefined;

    for (const [_bundleId, bundleComponents] of this.components.entries()) {
      for (const [_componentName, entry] of bundleComponents.entries()) {
        if (entry.metadata.factory === factoryName) {
          factoryComponent = entry;
          break;
        }
      }
      if (factoryComponent) break;
    }

    if (!factoryComponent || !factoryComponent.factoryInstances) {
      throw new Error(`Factory component with factory ID ${factoryName} not active in any bundle`);
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
        this.framework
          .getLogger()
          .error(`Error during deactivation of factory instance ${instanceName}:`, error as Error);
      }
    }

    factoryComponent.factoryInstances.delete(instanceName);
  }

  private async hasConfiguration(configPid?: string): Promise<boolean> {
    if (!configPid) {
      return true; // No configuration PID specified, so no configuration required
    }

    if (!this.configAdmin) {
      return false; // Configuration required but no ConfigAdmin available
    }

    try {
      const filter = `(service.pid=${configPid})`;
      const configs = await this.configAdmin.listConfigurations(filter);
      return configs !== null && configs.length > 0;
    } catch (error) {
      this.framework.getLogger().error(`Error checking configuration existence for PID ${configPid}:`, error as Error);
      return false;
    }
  }

  satisfyReferenceForInstance(instance: any, ref: ReferenceDescriptor) {
    const filter = ref.target || null;

    // Determine the bundle context of the component instance
    let owningBundleId: number | undefined;
    for (const [currentBundleId, bundleComponents] of this.components.entries()) {
      for (const [_currentName, entry] of bundleComponents.entries()) {
        if (entry.instance === instance || entry.bundleInstances?.has?.(currentBundleId)) {
          owningBundleId = currentBundleId;
          break;
        }
      }
      if (owningBundleId !== undefined) break;
    }
    const componentCtx =
      owningBundleId !== undefined
        ? this.framework.getBundle(owningBundleId)?.getContext() || this.bundleContext
        : this.bundleContext;

    const serviceRefs = componentCtx.getServiceReferences(ref.interface, filter) ?? [];
    const cardinality = ref.cardinality || '0..1';

    if (cardinality === '1..1' || cardinality === '0..1') {
      if (serviceRefs.length > 0) {
        const service = componentCtx.getService(serviceRefs[0]);
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
      const services = serviceRefs.map((ref) => componentCtx.getService(ref)).filter(Boolean);

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

  async updateComponentConfiguration(
    bundleId: number,
    componentName: string,
    configuration: Record<string, any>,
  ): Promise<void> {
    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    const entry = bundleComponents.get(componentName);
    if (!entry || !entry.instance) {
      throw new Error(`Component ${componentName} not active in bundle ${bundleId}`);
    }

    const { metadata, instance } = entry;
    if (metadata.modified && typeof instance[metadata.modified] === 'function') {
      await instance[metadata.modified](configuration);
    }

    this.publishScrEvent('scr/component/config-updated', {
      'bundle.id': bundleId,
      'component.name': componentName,
      configuration,
      decorators: getDecoratorInfo(entry.metadata.class || entry.metadata),
    });
  }

  /**
   * Deactivates all components for a specific bundle
   * Called when a bundle is stopping
   */
  async deactivateBundleComponents(bundleId: number): Promise<void> {
    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      return; // No components for this bundle
    }

    // Deactivate all components in this bundle
    const componentNames = Array.from(bundleComponents.keys());
    for (const componentName of componentNames) {
      try {
        await this.deactivateComponent(bundleId, componentName);
      } catch (error) {
        this.framework
          .getLogger()
          .error(`Failed to deactivate component ${componentName} from bundle ${bundleId}:`, error as Error);
      }
    }
  }

  /**
   * Removes all components for a specific bundle
   * Called when a bundle is uninstalled
   */
  async removeBundleComponents(bundleId: number): Promise<void> {
    const bundleComponents = this.components.get(bundleId);
    if (!bundleComponents) {
      return; // No components for this bundle
    }

    // First deactivate all components
    await this.deactivateBundleComponents(bundleId);

    for (const [componentName, entry] of bundleComponents.entries()) {
      try {
        this.publishScrEvent('scr/component/removed', {
          'bundle.id': bundleId,
          'component.name': componentName,
          decorators: getDecoratorInfo(entry.metadata.class || entry.metadata),
        });
      } catch (e) {
        this.framework
          .getLogger()
          .error(`Failed to publish removed for ${componentName} from bundle ${bundleId}:`, e as Error);
      }
    }

    // Then remove the entire bundle entry
    this.components.delete(bundleId);

    this.framework.getLogger().debug(`Removed all components for bundle ${bundleId}`);
  }
}
