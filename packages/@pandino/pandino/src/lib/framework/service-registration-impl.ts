import {
  OBJECTCLASS,
  SCOPE_SINGLETON,
  SERVICE_BUNDLEID,
  SERVICE_ID,
  SERVICE_SCOPE,
  SCOPE_BUNDLE,
  SCOPE_PROTOTYPE,
} from '@pandino/pandino-api';
import type {
  Bundle,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  ServiceFactory,
} from '@pandino/pandino-api';
import { ServiceReferenceImpl } from './service-reference-impl';
import { ServiceRegistry } from './service-registry';
import { ServiceRegistryImpl } from './service-registry-impl';

export class ServiceRegistrationImpl implements ServiceRegistration<any> {
  private readonly registry: ServiceRegistry;
  private readonly bundle: Bundle;
  private readonly classes: string | string[];
  private readonly serviceId: number;
  private svcObj: any;
  private factory?: ServiceFactory<any>;
  private propMap: ServiceProperties;
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
    this.factory = (this.svcObj as ServiceFactory<any>).factoryType ? this.svcObj : undefined;
    this.propMap = dict || {};

    this.initializeProperties(dict);

    this.ref = new ServiceReferenceImpl(this, bundle);
  }

  isValid(): boolean {
    return !!this.svcObj;
  }

  invalidate(): void {
    this.svcObj = null;
  }

  getUsingBundles(ref: ServiceReference<any>): Array<Bundle> {
    return this.registry.getUsingBundles(ref);
  }

  getService(acqBundle: Bundle): any {
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
    let oldProps: ServiceProperties | undefined;
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
    this.factory = undefined;
  }

  getProperty(key: string): any | undefined {
    return this.propMap ? this.propMap[key] : undefined;
  }

  getProperties(): ServiceProperties {
    return this.propMap;
  }

  getPropertyKeys(): Array<string> {
    return Object.keys(this.propMap || {});
  }

  private getFactoryUnchecked(bundle: Bundle): any | undefined {
    return this.factory?.getService(bundle, this);
  }

  private ungetFactoryUnchecked(bundle: Bundle, svcObj: any): void {
    this.factory?.ungetService(bundle, this, svcObj);
  }

  private initializeProperties(dict?: Record<string, any>): void {
    const props: Record<string, any> = {};
    if (dict) {
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
