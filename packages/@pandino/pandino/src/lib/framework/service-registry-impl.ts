import { Logger, OBJECTCLASS, SCOPE_PROTOTYPE, SERVICE_ID, SERVICE_SCOPE } from '@pandino/pandino-api';
import type { Bundle, ServiceProperties, ServiceReference, ServiceRegistration } from '@pandino/pandino-api';
import { parseFilter } from '@pandino/filters';
import type { FilterNode } from '@pandino/filters';
import { ServiceRegistrationImpl } from './service-registration-impl';
import { ServiceEventImpl } from './service-event-impl';
import { ServiceReferenceImpl } from './service-reference-impl';
import { CapabilitySet } from './capability-set/capability-set';
import { BundleCapabilityImpl } from './wiring/bundle-capability-impl';
import { UsageCountImpl } from './usage-count-impl';
import type { ServiceRegistryCallbacks } from './service-registry-callbacks';
import type { Capability } from './resource';
import type { ServiceRegistry } from './service-registry';
import type { UsageCount } from './usage-count';

export class ServiceRegistryImpl implements ServiceRegistry {
  private readonly logger: Logger;
  private readonly callbacks: ServiceRegistryCallbacks;
  private readonly regsMap: Map<Bundle, Array<ServiceRegistration<any>>> = new Map<Bundle, Array<ServiceRegistration<any>>>();
  private readonly regCapSet: CapabilitySet = new CapabilitySet([OBJECTCLASS]);
  private readonly inUseMap: Map<Bundle, UsageCount[]> = new Map<Bundle, UsageCount[]>();
  private currentServiceId = 0;

  constructor(logger: Logger, callbacks: ServiceRegistryCallbacks) {
    this.logger = logger;
    this.callbacks = callbacks;
  }

  getRegisteredServices(bundle: Bundle): ServiceReference<any>[] {
    const regs = this.regsMap.get(bundle);
    if (Array.isArray(regs)) {
      const refs: Array<ServiceReference<any>> = [];
      for (const reg of regs) {
        try {
          refs.push(reg.getReference());
        } catch (ex) {
          // Don't include the reference as it is not valid anymore
        }
      }
      return refs;
    }
    return [];
  }

  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects = false): S | undefined {
    const isPrototype = isServiceObjects && ref.getProperty(SERVICE_SCOPE) === SCOPE_PROTOTYPE;
    let usage: UsageCount | undefined;
    let svcObj: any;

    const reg = (ref as ServiceReferenceImpl).getRegistration();

    try {
      if (reg.isValid()) {
        // Get the usage count, or create a new one. If this is a prototype, then we'll always create a new one.
        usage = this.obtainUsageCount(bundle, ref, undefined, isPrototype);

        if (usage) {
          usage.incrementToPositiveValue();
          svcObj = usage.getService();

          if (!svcObj) {
            svcObj = reg.getService(bundle);
            usage.setService(svcObj);
          }

          if (isServiceObjects) {
            usage.incrementServiceObjectsCountToPositiveValue();
          }
        }

        if (usage && isPrototype) {
          const existingUsage = this.obtainUsageCount(bundle, ref, svcObj);
          if (existingUsage && existingUsage !== usage) {
            this.flushUsageCount(bundle, ref, usage);
            usage = existingUsage;
            usage.incrementToPositiveValue();
            if (isServiceObjects) {
              usage.incrementServiceObjectsCountToPositiveValue();
            }
          }
        }
      }
    } finally {
      if (!reg.isValid() || !svcObj) {
        this.flushUsageCount(bundle, ref, usage);
      }
    }

    return svcObj as S;
  }

  servicePropertiesModified(reg: ServiceRegistration<any>, oldProps: ServiceProperties): void {
    if (this.callbacks) {
      this.callbacks.serviceChanged(new ServiceEventImpl('MODIFIED', reg.getReference()), oldProps);
    }
  }

  getServiceReferences(identifier?: string, filter?: string): Array<Capability> {
    let filterEffective = filter ? parseFilter(filter) : undefined;
    if (!identifier && !filterEffective) {
      filterEffective = { attribute: undefined, operator: 'eq', value: '*' };
    } else if (identifier && !filterEffective) {
      filterEffective = { attribute: OBJECTCLASS, operator: 'eq', value: identifier };
    } else if (identifier && filterEffective) {
      const filters: Array<FilterNode> = [];
      filters.push({ attribute: OBJECTCLASS, operator: 'eq', value: identifier });
      filters.push(filterEffective);
      filterEffective = { operator: 'and', children: filters };
    }

    return Array.from(this.regCapSet.match(filterEffective!, false));
  }

  getUsingBundles(ref: ServiceReference<any>): Bundle[] {
    let bundles: Bundle[] = [];
    for (const bundle of this.inUseMap.keys()) {
      const usages = this.inUseMap.get(bundle);
      if (Array.isArray(usages)) {
        for (const usage of usages) {
          if (usage.getReference().compareTo(ref) === 0 && usage.getCount() > 0) {
            bundles.push(bundle);
          }
        }
      }
    }
    return bundles;
  }

  registerService(bundle: Bundle, classNames: string | string[], svcObj: any, dict?: ServiceProperties): ServiceRegistration<any> {
    const reg = new ServiceRegistrationImpl(this, bundle, classNames, ++this.currentServiceId, svcObj, dict);

    if (!this.regsMap.has(bundle)) {
      this.regsMap.set(bundle, []);
    }

    const regs = this.regsMap.get(bundle);

    // TODO: implement check if same service gets registered or not!
    if (!regs) {
      // this.logger.warn(`There are no registrations for bundle! (${bundle.getSymbolicName()})`);
    } else if (regs && !regs.find((r) => r.getReference().getProperty(SERVICE_ID) === reg.getReference().getProperty(SERVICE_ID))) {
      regs.push(reg);
    } else {
      this.logger.warn(`Service already registered, skipping! (${reg.getReference().getProperty(SERVICE_ID)})`);
    }
    this.regCapSet.addCapability(reg.getReference() as unknown as BundleCapabilityImpl);

    return reg;
  }

  unregisterService<S>(bundle: Bundle, reg: ServiceRegistration<S>): void {
    const regs = this.regsMap.get(bundle);
    if (Array.isArray(regs)) {
      const remIdx = regs.findIndex((r) => r === reg);
      if (remIdx > -1) {
        regs.splice(remIdx, 1);
      }
    }

    this.regCapSet.removeCapability(reg.getReference() as unknown as BundleCapabilityImpl);

    if (this.callbacks) {
      this.callbacks.serviceChanged(new ServiceEventImpl('UNREGISTERING', reg.getReference()), undefined);
    }

    const ref = reg.getReference();
    this.ungetServicesByRef(ref);

    (reg as ServiceRegistrationImpl).invalidate();

    this.ungetServicesByRef(ref);

    for (const bundle of this.inUseMap.keys()) {
      this.flushUsageCount(bundle, ref);
    }
  }

  ungetService(bundle: Bundle, ref: ServiceReference<any>, svcObj: any): boolean {
    const reg: ServiceRegistrationImpl = (ref as ServiceReferenceImpl).getRegistration();

    try {
      const usage = this.obtainUsageCount(bundle, ref, svcObj);

      if (!usage) {
        return false;
      }

      if (svcObj) {
        if (usage.decrementAndGet() < 0) {
          return false;
        }
      }

      const count = usage.decrementAndGet();
      try {
        if (count <= 0) {
          const svc = usage.getService();

          if (svc) {
            usage.setService(null);
            if (usage.getCount() <= 0) {
              // Temporarily increase the usage again so that the service factory still sees the usage in the unget
              usage.incrementToPositiveValue();
              try {
                // Remove reference from usages array.
                reg.ungetService(bundle, svc);
              } finally {
                // now we can decrease the usage again
                usage.decrementAndGet();
              }
            }
          }
        }

        return usage.getCount() >= 0;
      } finally {
        if (!reg.isValid()) {
          usage.setService(null);
        }

        if (!reg.isValid() || (count <= 0 && svcObj)) {
          this.flushUsageCount(bundle, ref, usage);
        }
      }
    } finally {
      // no-nop
    }
  }

  /**
   * Utility method to flush the specified bundle's usage count for the specified service reference. This should be
   * called to completely remove the associated usage count object for the specified service reference. If the goal is
   * to simply decrement the usage, then get the usage count and decrement its counter. This method will also remove
   * the specified bundle from the "in use" map if it has no more usage counts after removing the usage count for the
   * specified service reference.
   **/
  private flushUsageCount(bundle: Bundle, ref: ServiceReference<any>, uc?: UsageCount): void {
    const usages: UsageCount[] = this.inUseMap.get(bundle) || [];
    let processUsage = true;

    while (processUsage) {
      const usageIdx = usages.findIndex((usage) => (!uc && usage.getReference().compareTo(ref) === 0) || uc === usage);

      if (usageIdx > -1) {
        usages.splice(usageIdx, 1);
      } else {
        processUsage = false;
      }
    }

    if (usages.length === 0) {
      this.inUseMap.delete(bundle);
    }
  }

  /**
   * Obtain a UsageCount object, by looking for an existing one or creating a new one (if possible). This method tries
   * to find a UsageCount object in the {@code inUseMap}. If one is found then this is returned, otherwise a UsageCount
   * object will be created, but this can only be done if the {@code isPrototype} parameter is not {@code undefined}.
   * If {@code isPrototype} is {@code TRUE} then a new UsageCount object will always be created.
   */
  obtainUsageCount(bundle: Bundle, ref: ServiceReference<any>, svcObj: any, isPrototype = false): UsageCount | undefined {
    let usage: UsageCount;

    const usages = this.inUseMap.get(bundle);

    if (!isPrototype && Array.isArray(usages)) {
      for (const usage of usages) {
        if (usage.getReference().compareTo(ref) === 0 && ((!svcObj && !usage.isPrototype()) || usage.getService() === svcObj)) {
          return usage;
        }
      }
    }

    // if (isAnyMissing(isPrototype)) {
    //   return undefined;
    // }

    usage = new UsageCountImpl(ref, isPrototype);

    if (!usages) {
      const newUsages: UsageCount[] = [usage];
      this.inUseMap.set(bundle, newUsages);
    } else {
      usages.push(usage);
    }
    return usage;
  }

  unregisterServices(bundle: Bundle): void {
    const regs = this.regsMap.get(bundle);
    this.regsMap.delete(bundle);

    if (Array.isArray(regs)) {
      for (const reg of regs) {
        if ((reg as ServiceRegistrationImpl).isValid()) {
          try {
            reg.unregister();
          } catch (ex) {
            // Ignore exception if the service has already been unregistered
          }
        }
      }
    }
  }

  ungetServices(bundle: Bundle): void {
    const usages = this.inUseMap.get(bundle);
    if (!Array.isArray(usages)) {
      return;
    }

    for (const usage of usages) {
      // Keep ungetting until all usage count is zero.
      while (this.ungetService(bundle, usage.getReference(), usage.isPrototype() ? usage.getService() : null)) {
        // Empty loop body.
      }
    }
  }

  private ungetServicesByRef(ref: ServiceReference<any>): void {
    const clients: Bundle[] = this.getUsingBundles(ref);
    for (const client of clients) {
      const usages = this.inUseMap.get(client);
      if (Array.isArray(usages)) {
        for (const usage of usages) {
          if (usage.getReference().compareTo(ref) === 0) {
            this.ungetService(client, ref, usage.isPrototype() ? usage.getService() : null);
          }
        }
      }
    }
  }

  getLogger(): Logger {
    return this.logger;
  }

  getInUseMap(bundle: Bundle): UsageCount[] {
    return this.inUseMap.get(bundle) || [];
  }
}
