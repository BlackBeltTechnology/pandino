import type {
  ComponentConfiguration,
  ComponentConfigurationState,
  ComponentContext,
  ComponentInstance,
  ConfigurationPolicy,
  DeactivationReason,
  InternalActivatorMetaData,
  InternalDeActivatorMetaData,
  InternalMetaData,
  InternalModifiedMetaData,
  InternalReferenceMetaData,
  SatisfiedReference,
  UnsatisfiedReference,
} from '@pandino/scr-api';
import {
  COMPONENT_ACTIVATE_KEY_METHOD,
  COMPONENT_DEACTIVATE_KEY_METHOD,
  COMPONENT_KEY_CONFIGURATION_PID,
  COMPONENT_KEY_CONFIGURATION_POLICY,
  COMPONENT_KEY_NAME,
  COMPONENT_KEY_PROPERTY,
  COMPONENT_MODIFIED_KEY_METHOD,
  REFERENCE_KEY_CARDINALITY,
  REFERENCE_KEY_SERVICE,
  REFERENCE_KEY_TARGET,
} from '@pandino/scr-api';
import type {
  BundleContext,
  Logger,
  ServiceEvent,
  ServiceListener,
  ServiceProperties,
  ServiceReference,
  ServiceRegistration,
  ServiceUtils,
} from '@pandino/pandino-api';
import { SERVICE_PID } from '@pandino/pandino-api';
import { ComponentContextImpl } from './ComponentContextImpl';
import type { Configuration, ConfigurationAdmin, ConfigurationEvent, ConfigurationListener } from '@pandino/configuration-management-api';
import { ComponentInstanceImpl } from './ComponentInstanceImpl';
import { SatisfiedReferenceImpl } from './SatisfiedReferenceImpl';
import { UnsatisfiedReferenceImpl } from './UnsatisfiedReferenceImpl';

export class ComponentConfigurationImpl<S> implements ComponentConfiguration<S>, ConfigurationListener {
  private readonly id: number;
  private readonly pid: string;
  private readonly internalMetaData: InternalMetaData;
  private readonly configurationPolicy: ConfigurationPolicy;
  // @ts-ignore
  private readonly componentContext: ComponentContext<S>;
  private readonly declaringBundleContext: BundleContext;
  private readonly configAdmin: ConfigurationAdmin;
  private readonly serviceUtils: ServiceUtils;
  // @ts-ignore
  private readonly instance: ComponentInstance<S>;
  private readonly logger: Logger;
  private configuration?: Configuration;
  private state: ComponentConfigurationState = 'UNSATISFIED_CONFIGURATION';
  private serviceRegistration?: ServiceRegistration<S>;
  private satisfiedReferences: SatisfiedReference[] = [];
  private unsatisfiedReferences: UnsatisfiedReference[] = [];
  private isActive: boolean = false;
  private readonly serviceListeners: Map<string, ServiceListener> = new Map<string, ServiceListener>();

  constructor(
    pid: string,
    input: InternalMetaData,
    targetConstructor: any,
    declaringBundleContext: BundleContext,
    configAdmin: ConfigurationAdmin,
    logger: Logger,
    serviceUtils: ServiceUtils,
  ) {
    this.pid = pid;
    this.id = new Date().valueOf();
    this.logger = logger;
    this.declaringBundleContext = declaringBundleContext;
    this.configAdmin = configAdmin;
    this.internalMetaData = input;
    this.serviceUtils = serviceUtils;
    this.configurationPolicy = this.internalMetaData[COMPONENT_KEY_CONFIGURATION_POLICY];

    if (this.configurationRequiredAndNotSatisfied()) {
      this.state = 'UNSATISFIED_CONFIGURATION';
      this.isActive = false;
      return;
    }

    if (this.configurationRequiredAndSatisfied()) {
      this.configuration = this.configAdmin.getConfiguration(Array.isArray(this.pid) ? this.pid[0] : this.pid);
      this.configuration.update({
        ...this.internalMetaData[COMPONENT_KEY_PROPERTY],
        ...this.configuration.getProperties(),
      });
    }

    this.instance = new ComponentInstanceImpl(targetConstructor);
    this.componentContext = new ComponentContextImpl(this, declaringBundleContext, this.instance);

    this.updateRefs();
    this.updateState();
    this.setUpServiceListeners();
  }

  private updateState(): void {
    if (this.configurationRequiredAndNotSatisfied()) {
      this.state = 'UNSATISFIED_CONFIGURATION';
      this.deactivate('CONFIGURATION_DELETED');
    } else if (!this.allMandatoryRefsSatisfied()) {
      this.state = 'UNSATISFIED_REFERENCE';
      this.deactivate('REFERENCE');
    } else {
      this.state = 'SATISFIED';
      this.activate();
    }
  }

  private setUpServiceListeners(): void {
    const fields = Object.keys(this.internalMetaData.references);
    for (const field of fields) {
      const refMeta: InternalReferenceMetaData = this.internalMetaData.references[field];
      if (!this.serviceListeners.has(field)) {
        const listener: ServiceListener = {
          isSync: true,
          serviceChanged: (event: ServiceEvent) => {
            this.onServiceListenerChanged(field, refMeta[REFERENCE_KEY_SERVICE], event, refMeta[REFERENCE_KEY_TARGET]);
          },
        };
        this.serviceListeners.set(field, listener);
      }
    }
  }

  private activate(): void {
    if (!this.isActive) {
      try {
        // 112.5.9 Activation Objects
        this.invokeActivateIfPresent(this.componentContext, this.declaringBundleContext, this.configuration?.getProperties());
        this.serviceRegistration = this.declaringBundleContext.registerService(this.internalMetaData[COMPONENT_KEY_CONFIGURATION_PID], this.instance);
        this.isActive = true;
        this.state = 'ACTIVE';
      } catch (e: any) {
        this.serviceRegistration?.unregister();
        this.isActive = false;
        this.state = 'FAILED_ACTIVATION';
        this.logger.error(`Error during @Activate of Component (${this.internalMetaData[COMPONENT_KEY_NAME]}): ${e}`);
      }
    }
  }

  private deactivate(reason: DeactivationReason) {
    if (this.isActive) {
      try {
        // 112.5.16 Deactivation
        this.invokeDeactivateIfPresent(this.componentContext, this.declaringBundleContext);
        for (const sRef of this.satisfiedReferences) {
          for (const bRef of sRef.getBoundServices()) {
            this.declaringBundleContext.ungetService(bRef);
          }
        }
        this.serviceRegistration?.unregister();
      } catch (e: any) {
        this.logger.error(`Error during @Deactivate of Component (${this.internalMetaData[COMPONENT_KEY_NAME]}): ${e}`);
      }
      this.isActive = false;
      if (this.configurationRequiredAndNotSatisfied()) {
        this.state = 'UNSATISFIED_CONFIGURATION';
      } else if (!this.allMandatoryRefsSatisfied()) {
        this.state = 'UNSATISFIED_REFERENCE';
      }
    }
  }

  private configurationRequiredAndSatisfied(): boolean {
    const configurations = this.configAdmin.listConfigurations(`(${SERVICE_PID}=${this.pid})`);
    return this.configurationPolicy === 'REQUIRE' && configurations.length > 0;
  }

  private configurationRequiredAndNotSatisfied(): boolean {
    const configurations = this.configAdmin.listConfigurations(`(${SERVICE_PID}=${this.pid})`);
    return this.configurationPolicy === 'REQUIRE' && configurations.length === 0;
  }

  private allMandatoryRefsSatisfied(): boolean {
    const fields = Object.keys(this.internalMetaData.references);
    for (const field of fields) {
      const refMeta: InternalReferenceMetaData = this.internalMetaData.references[field];
      if (refMeta[REFERENCE_KEY_CARDINALITY] === 'MANDATORY') {
        if (
          !this.unsatisfiedReferences.some(
            (r) => r.getName() === refMeta[REFERENCE_KEY_SERVICE] && (!refMeta[REFERENCE_KEY_TARGET] || r.getTarget() === refMeta[REFERENCE_KEY_TARGET]),
          )
        ) {
          return false;
        }
      }
    }
    return true;
  }

  private updateRefs(): void {
    this.satisfiedReferences = [];
    this.unsatisfiedReferences = [];
    const fields = Object.keys(this.internalMetaData.references);

    for (const field of fields) {
      const refMeta: InternalReferenceMetaData = this.internalMetaData.references[field];
      const references = this.declaringBundleContext.getAllServiceReferences(refMeta[REFERENCE_KEY_SERVICE], refMeta[REFERENCE_KEY_TARGET]);
      if (references.length > 0) {
        if (!this.satisfiedReferences.some((s) => (s as SatisfiedReferenceImpl<any>).equals(refMeta))) {
          const satRef = new SatisfiedReferenceImpl(refMeta[REFERENCE_KEY_SERVICE], refMeta[REFERENCE_KEY_TARGET], references);
          this.satisfiedReferences.push(satRef);
        }
      } else {
        const existingIdx = this.satisfiedReferences.findIndex((s) => (s as SatisfiedReferenceImpl<any>).equals(refMeta));
        if (existingIdx > -1) {
          const satRef = this.satisfiedReferences[existingIdx];
          this.satisfiedReferences.splice(existingIdx, 1);
          for (const bound of satRef.getBoundServices()) {
            this.declaringBundleContext.ungetService(bound);
          }
        }
        if (!this.unsatisfiedReferences.some((s) => (s as SatisfiedReferenceImpl<any>).equals(refMeta))) {
          const unsatRef = new UnsatisfiedReferenceImpl(refMeta[REFERENCE_KEY_SERVICE], refMeta[REFERENCE_KEY_TARGET]);
          this.unsatisfiedReferences.push(unsatRef);
        }
      }
      this.updateReferenceField(field, references);
    }
  }

  private updateReferenceField(field: string, references: ServiceReference<any>[]) {
    const inst: any = this.instance.getInstance();
    const ref = this.serviceUtils.getBestServiceReference(references);
    if (ref) {
      inst[field] = this.declaringBundleContext.getService(ref);
    } else {
      inst[field] = undefined;
    }
  }

  private componentHasModifiedMethod(): boolean {
    return !!this.internalMetaData[COMPONENT_MODIFIED_KEY_METHOD];
  }

  private invokeModifiedIfPresent(componentContext: ComponentContext<S>, bundleContext: BundleContext, properties?: ServiceProperties): void {
    if (this.componentHasModifiedMethod()) {
      const modifiedMeta = this.getInternalModifiedMetaData()!;
      // @ts-ignore
      this.instance.getInstance()[modifiedMeta.method as keyof S](componentContext, bundleContext, properties);
    }
  }

  private componentHasActivateMethod(): boolean {
    return !!this.internalMetaData[COMPONENT_ACTIVATE_KEY_METHOD];
  }

  private invokeActivateIfPresent(componentContext: ComponentContext<S>, bundleContext: BundleContext, properties?: ServiceProperties): void {
    if (this.componentHasActivateMethod()) {
      const activatorMeta = this.getInternalActivatorMetaData()!;
      // @ts-ignore
      this.instance.getInstance()[activatorMeta.method as keyof S](componentContext, bundleContext, properties);
    }
  }

  private componentHasDeactivateMethod(): boolean {
    return !!this.internalMetaData[COMPONENT_DEACTIVATE_KEY_METHOD];
  }

  private invokeDeactivateIfPresent(componentContext: ComponentContext<S>, bundleContext: BundleContext): void {
    if (this.componentHasDeactivateMethod()) {
      const deActivatorMeta = this.getInternalDeactivatorMetaData()!;
      // @ts-ignore
      this.instance.getInstance()[deActivatorMeta.method as keyof S](componentContext, bundleContext);
    }
  }

  private getInternalModifiedMetaData(): InternalModifiedMetaData | undefined {
    return this.internalMetaData[COMPONENT_MODIFIED_KEY_METHOD];
  }

  private getInternalActivatorMetaData(): InternalActivatorMetaData | undefined {
    return this.internalMetaData[COMPONENT_ACTIVATE_KEY_METHOD];
  }

  private getInternalDeactivatorMetaData(): InternalDeActivatorMetaData | undefined {
    return this.internalMetaData[COMPONENT_DEACTIVATE_KEY_METHOD];
  }

  getId(): number {
    return this.id;
  }

  getPID(): string | string[] {
    return this.pid;
  }

  getConfigurationPolicy(): ConfigurationPolicy {
    throw this.configurationPolicy;
  }

  getService(): ServiceReference<S> | undefined {
    return this.serviceRegistration?.getReference();
  }

  getProperties(): ServiceProperties {
    if (this.configuration) {
      return {
        ...this.internalMetaData[COMPONENT_KEY_PROPERTY],
        ...this.configuration.getProperties(),
      };
    }
    return this.internalMetaData[COMPONENT_KEY_PROPERTY];
  }

  getSatisfiedReferences(): SatisfiedReference[] {
    return this.satisfiedReferences;
  }

  getState(): ComponentConfigurationState {
    return this.state;
  }

  getUnsatisfiedReferences(): UnsatisfiedReference[] {
    return this.unsatisfiedReferences;
  }

  configurationEvent(event: ConfigurationEvent): void {
    if (event.getType() === 'UPDATED') {
      if (!this.isActive) {
        if (this.configurationPolicy === 'REQUIRE') {
          this.activate();
        }
      } else {
        this.invokeModifiedIfPresent(this.componentContext, this.declaringBundleContext, event.getReference().getProperties());
      }
    } else if (event.getType() === 'DELETED') {
      if (this.configurationPolicy === 'REQUIRE') {
        this.deactivate('CONFIGURATION_DELETED');
      }
    }
  }

  onServiceListenerChanged(field: string, service: string, event: ServiceEvent, target?: string): void {
    // todo call potential service handler method once introduced
    this.updateRefs();
  }
}
