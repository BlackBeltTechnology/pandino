import {
  Bundle,
  Capability,
  FilterApi,
  Logger,
  OBJECTCLASS,
  SERVICE_ID,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  ServiceRegistry,
  ServiceRegistryCallbacks,
} from '@pandino/pandino-api';
import { ServiceRegistrationImpl } from './service-registration-impl';
import { isAllPresent, isAnyMissing } from '../utils/helpers';
import { ServiceEventImpl } from './service-event-impl';
import { ServiceReferenceImpl } from './service-reference-impl';
import Filter, { FilterComp } from '../filter/filter';
import { CapabilitySet } from './capability-set/capability-set';
import { BundleCapabilityImpl } from './wiring/bundle-capability-impl';

export class ServiceRegistryImpl implements ServiceRegistry {
  private readonly logger: Logger;
  private readonly callbacks: ServiceRegistryCallbacks;
  private readonly regsMap: Map<Bundle, Array<ServiceRegistration<any>>> = new Map<
    Bundle,
    Array<ServiceRegistration<any>>
  >();
  private readonly regCapSet: CapabilitySet = new CapabilitySet([OBJECTCLASS]);
  private readonly inUseMap: Map<Bundle, UsageCount[]> = new Map<Bundle, UsageCount[]>();

  constructor(logger: Logger, callbacks: ServiceRegistryCallbacks) {
    this.logger = logger;
    this.callbacks = callbacks;
  }

  getRegisteredServices(bundle: Bundle): ServiceReference<any>[] {
    const regs: Array<ServiceRegistration<any>> = this.regsMap.get(bundle);
    if (isAllPresent(regs)) {
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

  getService<S>(bundle: Bundle, ref: ServiceReference<S>, isServiceObjects: boolean): S {
    const isPrototype = false;
    let usage: UsageCount = null;
    let svcObj: any = null;

    const reg = (ref as ServiceReferenceImpl).getRegistration();

    try {
      if (reg.isValid()) {
        usage = this.obtainUsageCount(bundle, ref, null, isPrototype);

        usage.incrementToPositiveValue();
        svcObj = usage.getService();

        if (isServiceObjects) {
          usage.incrementServiceObjectsCountToPositiveValue();
        }

        if (isAllPresent(usage)) {
          // TODO: handle prototype use-case
        }
      }
    } finally {
      if (!reg.isValid() || isAnyMissing(svcObj)) {
        this.flushUsageCount(bundle, ref, usage);
      }
    }

    return svcObj as S;
  }

  servicePropertiesModified(reg: ServiceRegistration<any>, oldProps: ServiceProperties): void {
    if (isAllPresent(this.callbacks)) {
      this.callbacks.serviceChanged(new ServiceEventImpl('MODIFIED', reg.getReference()), oldProps);
    }
  }

  getServiceReferences(identifier: string, filter: FilterApi): Array<Capability> {
    let filterEffective: Filter = filter as Filter;
    if (isAnyMissing(identifier) && isAnyMissing(filter)) {
      filterEffective = new Filter(null, FilterComp.MATCH_ALL, null);
    } else if (isAllPresent(identifier) && isAnyMissing(filter)) {
      filterEffective = new Filter(OBJECTCLASS, FilterComp.EQ, identifier);
    } else if (isAllPresent(identifier) && isAllPresent(filter)) {
      const filters: Array<Filter> = [];
      filters.push(new Filter(OBJECTCLASS, FilterComp.EQ, identifier));
      filters.push(filter as Filter);
      filterEffective = new Filter(null, FilterComp.AND, filters);
    }

    return Array.from(this.regCapSet.match(filterEffective, false));
  }

  getUsingBundles(ref: ServiceReference<any>): Bundle[] {
    let bundles: Bundle[] = null;
    for (const bundle of this.inUseMap.keys()) {
      const usages = this.inUseMap.get(bundle);
      for (const usage of usages) {
        if (usage.getReference().compareTo(ref) === 0 && usage.getCount() > 0) {
          if (isAnyMissing(bundles)) {
            bundles = [bundle];
          } else {
            bundles.push(bundle);
          }
        }
      }
    }
    return bundles;
  }

  registerService(
    bundle: Bundle,
    classNames: string | string[],
    svcObj: any,
    dict?: ServiceProperties,
  ): ServiceRegistration<any> {
    const reg = new ServiceRegistrationImpl(this, bundle, classNames, svcObj, dict);

    if (!this.regsMap.has(bundle)) {
      this.regsMap.set(bundle, []);
    }

    const regs = this.regsMap.get(bundle);

    // TODO: implement check if same service gets registered or not!
    if (!regs.find((r) => r.getReference().getProperty(SERVICE_ID) === reg.getReference().getProperty(SERVICE_ID))) {
      regs.push(reg);
    } else {
      this.logger.warn(`Service already registered, skipping! (${reg.getReference().getProperty(SERVICE_ID)})`);
    }
    this.regCapSet.addCapability(reg.getReference() as unknown as BundleCapabilityImpl);

    return reg;
  }

  unregisterService<S>(bundle: Bundle, reg: ServiceRegistration<S>): void {
    const regs: Array<ServiceRegistration<any>> = this.regsMap.get(bundle);
    if (isAllPresent(regs)) {
      const remIdx = regs.findIndex((r) => r === reg);
      if (remIdx > -1) {
        regs.splice(remIdx, 1);
      }
    }

    this.regCapSet.removeCapability(reg.getReference() as unknown as BundleCapabilityImpl);

    if (isAllPresent(this.callbacks)) {
      this.callbacks.serviceChanged(new ServiceEventImpl('UNREGISTERING', reg.getReference()), null);
    }

    const ref = reg.getReference();
    this.ungetServices(ref);

    (reg as ServiceRegistrationImpl).invalidate();

    this.ungetServices(ref);
  }

  ungetService(bundle: Bundle, ref: ServiceReference<any>, svcObj: any): boolean {
    const reg: ServiceRegistrationImpl = (ref as ServiceReferenceImpl).getRegistration();

    try {
      const usage = this.obtainUsageCount(bundle, ref, svcObj);
      if (isAllPresent(svcObj)) {
        if (usage.decrementAndGet() < 0) {
          return false;
        }
      }

      const count = usage.decrementAndGet();
      try {
        if (count <= 0) {
          const svc = usage.getService();

          if (isAllPresent(svc)) {
            usage.setService(null);
            if (usage.getCount() <= 0) {
              usage.incrementAndGet();
              try {
                reg.ungetService(bundle, svc);
              } finally {
                usage.decrementAndGet();
              }
            }
          }
        }

        return count >= 0;
      } finally {
        if (!reg.isValid()) {
          usage.setService(null);
        }

        if (!reg.isValid() || (count <= 0 && isAllPresent(svcObj))) {
          this.flushUsageCount(bundle, ref, usage);
        }
      }
    } finally {
      // no-nop
    }
  }

  private flushUsageCount(bundle: Bundle, ref: ServiceReference<any>, uc: UsageCount): void {
    throw new Error('Not implemented yet.');
  }

  private obtainUsageCount(bundle: Bundle, ref: ServiceReference<any>, svcObj: any, isPrototype = false): UsageCount {
    let usage: UsageCount = null;

    const usages: UsageCount[] = this.inUseMap.get(bundle);

    if (!isPrototype) {
      for (const usage of usages) {
        if (usage.getReference().compareTo(ref) === 0) {
          return usage;
        }
      }
    }

    usage = new UsageCount(ref);

    if (!usages) {
      const newUsages: UsageCount[] = [usage];
      this.inUseMap.set(bundle, newUsages);
    } else {
      usages.push(usage);
    }
    return usage;
  }

  private ungetServices(ref: ServiceReference<any>): void {
    const clients: Bundle[] = this.getUsingBundles(ref);
    for (const client of clients) {
      const usages: UsageCount[] = this.inUseMap.get(client);
      for (const usage of usages) {
        if (usage.getReference().compareTo(ref) === 0) {
          this.ungetService(client, ref, null);
        }
      }
    }
  }
}

export class UsageCount {
  private readonly ref: ServiceReference<any>;
  private service?: any;
  private count = 0;
  private serviceObjectsCount = 0;

  constructor(ref: ServiceReference<any>) {
    this.ref = ref;
  }

  getReference(): ServiceReference<any> {
    return this.ref;
  }

  getCount(): number {
    return this.count;
  }

  incrementToPositiveValue(): number {
    if (this.count + 1 < 1) {
      this.count = 1;
    }
    this.count++;
    return this.count;
  }

  incrementServiceObjectsCountToPositiveValue(): number {
    if (this.serviceObjectsCount + 1 < 1) {
      this.serviceObjectsCount = 1;
    }
    this.serviceObjectsCount++;
    return this.serviceObjectsCount;
  }

  incrementAndGet(): number {
    return ++this.count;
  }

  decrementAndGet(): number {
    return --this.count;
  }

  getService(): any {
    return this.service;
  }

  setService(service: any): void {
    this.service = service;
  }
}
