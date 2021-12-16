import {
  Bundle,
  FilterApi,
  Logger,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  ServiceRegistry,
  ServiceRegistryCallbacks,
  SERVICE_ID,
} from '@pandino/pandino-api';
import { ServiceRegistrationImpl } from './service-registration-impl';
import { isAllPresent } from '../utils/helpers';
import { ServiceEventImpl } from './service-event-impl';

export class ServiceRegistryImpl implements ServiceRegistry {
  private readonly logger: Logger;
  private readonly callbacks: ServiceRegistryCallbacks;
  private readonly m_regsMap: Map<Bundle, Array<ServiceRegistration<any>>> = new Map<
    Bundle,
    Array<ServiceRegistration<any>>
  >();

  constructor(logger: Logger, callbacks: ServiceRegistryCallbacks) {
    this.logger = logger;
    this.callbacks = callbacks;
  }

  getRegisteredServices(bundle: Bundle): ServiceReference<any>[] {
    const regs: Array<ServiceRegistration<any>> = this.m_regsMap.get(bundle);
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
    return undefined;
  }

  servicePropertiesModified(reg: ServiceRegistration<any>, oldProps: ServiceProperties): void {
    if (isAllPresent(this.callbacks)) {
      this.callbacks.serviceChanged(new ServiceEventImpl('MODIFIED', reg.getReference()), oldProps);
    }
  }

  getServiceReferences(filter: FilterApi): ServiceReference<any>[] {
    return [];
  }

  getUsingBundles(ref: ServiceReference<any>): Bundle[] {
    return [];
  }

  registerService(
    bundle: Bundle,
    classNames: string | string[],
    svcObj: any,
    dict?: ServiceProperties,
  ): ServiceRegistration<any> {
    const reg = new ServiceRegistrationImpl(this, bundle, classNames, svcObj, dict);

    if (!this.m_regsMap.has(bundle)) {
      this.m_regsMap.set(bundle, []);
    }

    const regs = this.m_regsMap.get(bundle);

    // TODO: implement check if same service gets registered or not!
    if (!regs.find((r) => r.getReference().getProperty(SERVICE_ID) === reg.getReference().getProperty(SERVICE_ID))) {
      regs.push(reg);
    } else {
      this.logger.warn(`Service already registered, skipping! (${reg.getReference().getProperty(SERVICE_ID)})`);
    }

    return reg;
  }
}
