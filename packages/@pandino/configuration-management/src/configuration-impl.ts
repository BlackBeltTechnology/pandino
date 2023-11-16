import type { Configuration } from '@pandino/configuration-management-api';
import { SERVICE_PID } from '@pandino/pandino-api';
import type { ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { ConfigurationManager } from './configuration-manager';
import { TargetedPID } from './helper/targeted-pid';

export class ConfigurationImpl implements Configuration {
  private readonly configurationManager: ConfigurationManager;
  private readonly pid: TargetedPID;
  private isDeleted = false;
  private location?: string;
  private properties?: ServiceProperties;

  constructor(
    configurationManager: ConfigurationManager,
    pid: string,
    location?: string,
    properties?: ServiceProperties,
  ) {
    this.configurationManager = configurationManager;
    this.pid = new TargetedPID(pid);
    this.location = location;
    if (properties) {
      this.properties = {
        ...properties,
      };
    }
  }

  delete(): void {
    this.checkDeleted();
    this.configurationManager.deleteConfiguration(this.pid.toString());
    this.isDeleted = true;
  }

  equals(other: any): boolean {
    if (other === undefined || other === null) {
      return false;
    }
    if (other instanceof ConfigurationImpl) {
      return this.pid.toString() === other.getPid();
    }
    return false;
  }

  getBundleLocation(): string {
    this.checkDeleted();
    return this.location!;
  }

  getPid(): string {
    this.checkDeleted();
    return this.pid.toString();
  }

  getProcessedProperties(serviceReference: ServiceReference<any>): ServiceProperties | undefined {
    return this.getProperties();
  }

  getProperties(): ServiceProperties | undefined {
    this.checkDeleted();
    return this.properties
      ? {
          ...this.properties,
          [SERVICE_PID]: this.pid.toString(),
        }
      : undefined;
  }

  setBundleLocation(location?: string): void {
    this.checkDeleted();
    this.location = location;
  }

  update(properties?: ServiceProperties): void {
    this.checkDeleted();
    this.properties = properties;
    this.configurationManager.updateConfiguration(this);
  }

  getServicePid(): string {
    return this.pid.getServicePid();
  }

  getTargetedPid(): TargetedPID {
    return this.pid;
  }

  private checkDeleted(): void {
    if (this.isDeleted) {
      throw new Error(`Configuration for PID: ${this.pid}already deleted!`);
    }
  }
}
