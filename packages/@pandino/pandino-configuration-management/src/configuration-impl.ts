import { Configuration } from '@pandino/pandino-configuration-management-api';
import { ServiceProperties, ServiceReference } from '@pandino/pandino-api';
import { ConfigurationManager } from './configuration-manager';

export class ConfigurationImpl implements Configuration {
  private readonly configurationManager: ConfigurationManager;
  private readonly pid: string;
  private isDeleted = false;
  private location?: string;
  private properties?: ServiceProperties;

  constructor(configurationManager: ConfigurationManager, pid: string, location?: string) {
    this.configurationManager = configurationManager;
    this.pid = pid;
    this.location = location;
  }

  delete(): void {
    this.checkDeleted();
    this.configurationManager.deleteConfiguration(this.pid);
    this.isDeleted = true;
  }

  equals(other: any): boolean {
    if (other === undefined || other === null) {
      return false;
    }
    if (other instanceof ConfigurationImpl) {
      return this.pid === other.getPid();
    } else if (other && other?.pid && this.getPid() === other.pid) {
      return true;
    }
    return false;
  }

  getBundleLocation(): string {
    this.checkDeleted();
    return this.location;
  }

  getPid(): string {
    this.checkDeleted();
    return this.pid;
  }

  getProcessedProperties(serviceReference: ServiceReference<any>): ServiceProperties | undefined {
    return this.getProperties();
  }

  getProperties(): ServiceProperties | undefined {
    this.checkDeleted();
    return this.properties;
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

  private checkDeleted(): void {
    if (this.isDeleted) {
      throw new Error(`Configuration for PID: ${this.pid}already deleted!`);
    }
  }
}
