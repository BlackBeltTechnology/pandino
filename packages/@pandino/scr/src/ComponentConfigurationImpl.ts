import type {
  ComponentConfiguration,
  ComponentConfigurationState,
  ComponentContext,
  ComponentInstance,
  ConfigurationPolicy,
  InternalMetaData,
  SatisfiedReference,
  UnsatisfiedReference,
} from '@pandino/scr-api';
import {
  COMPONENT_KEY_CONFIGURATION_POLICY,
  COMPONENT_KEY_PROPERTY,
  COMPONENT_MODIFIED_KEY_METHOD,
  InternalModifiedMetaData,
} from '@pandino/scr-api';
import type { BundleContext, ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { ComponentContextImpl } from './ComponentContextImpl';
import {
  Configuration,
  ConfigurationAdmin,
  ConfigurationEvent,
  ConfigurationListener,
} from '@pandino/configuration-management-api';

export class ComponentConfigurationImpl<S> implements ComponentConfiguration<S>, ConfigurationListener {
  private readonly id: number;
  private readonly pid: string;
  private readonly targetConstructor: any;
  private readonly internalMetaData: InternalMetaData;
  private readonly configurationPolicy: ConfigurationPolicy;
  private readonly componentContext: ComponentContext<S>;
  private readonly scrContext: BundleContext;
  private readonly declaringBundleContext: BundleContext;
  private readonly configAdmin: ConfigurationAdmin;
  private readonly instance: any;
  private configuration: Configuration;
  private state: ComponentConfigurationState = 'UNSATISFIED_CONFIGURATION';
  private serviceReference?: ServiceReference<S>;
  private satisfiedReferences: SatisfiedReference[] = [];
  private unsatisfiedReferences: UnsatisfiedReference[] = [];

  constructor(
    pid: string,
    input: InternalMetaData,
    targetConstructor: any,
    scrContext: BundleContext,
    declaringBundleContext: BundleContext,
    configAdmin: ConfigurationAdmin,
  ) {
    this.pid = pid;
    this.id = new Date().valueOf();
    this.targetConstructor = targetConstructor;
    this.scrContext = scrContext;
    this.declaringBundleContext = declaringBundleContext;
    this.configAdmin = configAdmin;
    this.internalMetaData = input;
    this.configurationPolicy = this.internalMetaData[COMPONENT_KEY_CONFIGURATION_POLICY];
    this.componentContext = new ComponentContextImpl(this, this.targetConstructor);
    this.configuration = this.configAdmin.getConfiguration(Array.isArray(this.pid) ? this.pid[0] : this.pid);
    this.configuration.update({
      ...this.internalMetaData[COMPONENT_KEY_PROPERTY],
      ...this.configuration.getProperties(),
    });
    this.instance = new targetConstructor();
  }

  private componentHasModifiedMethod(): boolean {
    return !!this.internalMetaData[COMPONENT_MODIFIED_KEY_METHOD];
  }

  private getInternalModifiedMetaData(): InternalModifiedMetaData {
    return this.internalMetaData[COMPONENT_MODIFIED_KEY_METHOD]!;
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
    return this.serviceReference;
  }

  getProperties(): ServiceProperties {
    return this.configuration.getProperties()!;
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
    if (this.componentHasModifiedMethod()) {
      const modifiedMeta = this.getInternalModifiedMetaData();
      this.instance[modifiedMeta.method](event.getReference().getProperties(), this.componentContext);
    }
  }
}
