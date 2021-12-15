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
} from '@pandino/pandino-api';
import { ServiceRegistryImpl } from './service-registry-impl';
import { ServiceReferenceImpl } from './service-reference-impl';
import { isAllPresent } from '../utils/helpers';

export class ServiceRegistrationImpl implements ServiceRegistration<any> {
  private readonly ref: ServiceReferenceImpl;
  private readonly registry: ServiceRegistryImpl;
  private readonly bundle: Bundle;
  private readonly classes: string | string[];
  private readonly serviceId: number;
  private svcObj: any;
  private propMap?: ServiceProperties;
  private isUnregistering = false;

  constructor(
    registry: ServiceRegistryImpl,
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
    this.propMap = dict;

    this.initializeProperties(dict);

    this.ref = new ServiceReferenceImpl(this, bundle);
  }

  getReference(): ServiceReference<any> {
    return this.ref;
  }

  getProperty(key: string): any {
    return this.propMap[key];
  }

  getProperties(): ServiceProperties {
    return this.propMap;
  }

  setProperties(properties: ServiceProperties): void {
    let oldProps: ServiceProperties;
    if (!this.isValid()) {
      throw new Error('The service registration is no longer valid.');
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
    // this.registry.unregisterService(this.bundle, this);
    this.svcObj = null;
  }

  protected isValid(): boolean {
    return isAllPresent(this.svcObj);
  }

  private initializeProperties(dict: Record<string, any>): void {
    const props: Record<string, any> = {};
    if (isAllPresent(dict)) {
      Object.assign(props, { ...dict });
    }

    props[OBJECTCLASS] = this.classes;
    props[SERVICE_ID] = this.serviceId;
    props[SERVICE_BUNDLEID] = this.bundle.getBundleId();
    props[SERVICE_SCOPE] = SCOPE_SINGLETON;

    this.propMap = props;
  }
}
