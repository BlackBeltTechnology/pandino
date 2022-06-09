import {
  Bundle,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  OBJECTCLASS,
  SCOPE_SINGLETON,
  SERVICE_BUNDLEID,
  SERVICE_ID,
  SERVICE_SCOPE,
  SCOPE_BUNDLE,
  SCOPE_PROTOTYPE,
  ServiceFactory,
} from '@pandino/pandino-api';
import { ServiceReferenceImpl } from './service-reference-impl';
import { isAllPresent } from '../utils/helpers';
import { ServiceRegistry } from './service-registry';
import { ServiceRegistryImpl } from './service-registry-impl';

export class ServiceRegistrationImpl implements ServiceRegistration<any> {
  private readonly registry: ServiceRegistry;
  private readonly bundle: Bundle;
  private readonly classes: string | string[];
  private readonly serviceId: number;
  private svcObj: any;
  private factory?: ServiceFactory<any>;
  private propMap?: ServiceProperties;
  private readonly ref: ServiceReferenceImpl;
  private isUnregistering = false;

  constructor(
    registry: ServiceRegistry,
    bundle: Bundle,
    classNames: string | string[],
    serviceId: number,
    svcObj: any,
    dict?: ServiceProperties,
  ) {
    this.registry = registry;
    this.bundle = bundle;
    this.classes = classNames;
    this.serviceId = serviceId;
    this.svcObj = svcObj;
    this.factory = isAllPresent((this.svcObj as ServiceFactory<any>).factoryType) ? this.svcObj : undefined;
    this.propMap = dict;

    this.initializeProperties(dict);

    this.ref = new ServiceReferenceImpl(this, bundle);
  }

  isValid(): boolean {
    return isAllPresent(this.svcObj);
  }

  invalidate(): void {
    this.svcObj = null;
  }

  getUsingBundles(ref: ServiceReference<any>): Array<Bundle> {
    return this.registry.getUsingBundles(ref);
  }

  getService(acqBundle?: Bundle): any {
    if (this.factory) {
      return this.getFactoryUnchecked(acqBundle);
    }
    return this.svcObj;
  }

  ungetService(relBundle: Bundle, svcObj: any) {
    if (this.factory) {
      try {
        this.ungetFactoryUnchecked(relBundle, svcObj);
      } catch (e) {
        (this.registry as ServiceRegistryImpl)
          .getLogger()
          .error('ServiceRegistrationImpl: Error ungetting service.', e);
      }
    }
  }

  getReference(): ServiceReference<any> {
    if (!this.isValid()) {
      throw new Error('The service registration is no longer valid for class(es): ' + JSON.stringify(this.classes));
    }
    return this.ref;
  }

  setProperties(properties: ServiceProperties): void {
    let oldProps: ServiceProperties;
    if (!this.isValid()) {
      throw new Error('The service registration is no longer valid for class(es): ' + JSON.stringify(this.classes));
    }
    oldProps = this.propMap;
    this.initializeProperties(properties);
    this.registry.servicePropertiesModified(this, { ...oldProps });
  }

  unregister(): void {
    if (!this.isValid() || this.isUnregistering) {
      throw new Error('Service already unregistered.');
    }
    this.isUnregistering = true;
    // TODO: re-introduce
    this.registry.unregisterService(this.bundle, this);
    this.svcObj = null;
    this.factory = null;
  }

  getProperty(key: string): any {
    return this.propMap[key];
  }

  getProperties(): ServiceProperties {
    return this.propMap;
  }

  getPropertyKeys(): Array<string> {
    return Object.keys(this.propMap || {});
  }

  private getFactoryUnchecked(bundle?: Bundle): any {
    return this.factory.getService(bundle, this);
  }

  private ungetFactoryUnchecked(bundle: Bundle, svcObj: any): void {
    this.factory.ungetService(bundle, this, svcObj);
  }

  private initializeProperties(dict: Record<string, any>): void {
    const props: Record<string, any> = {};
    if (isAllPresent(dict)) {
      Object.assign(props, { ...dict });
    }

    props[OBJECTCLASS] = this.classes;
    props[SERVICE_ID] = this.serviceId;
    props[SERVICE_BUNDLEID] = this.bundle.getBundleId();

    if (this.factory) {
      props[SERVICE_SCOPE] = this.factory.factoryType === 'prototype' ? SCOPE_PROTOTYPE : SCOPE_BUNDLE;
    } else {
      props[SERVICE_SCOPE] = SCOPE_SINGLETON;
    }

    this.propMap = props;
  }
}
