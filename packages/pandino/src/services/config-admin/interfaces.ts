export interface ConfigurationAdmin {
  getConfiguration(pid: string, location?: string): Promise<Configuration>;
  createFactoryConfiguration(factoryPid: string, location?: string): Promise<Configuration>;
  listConfigurations(filter?: string): Promise<Configuration[] | null>;
}

export interface Configuration {
  getPid(): string;
  getFactoryPid(): string | null;
  getProperties(): Record<string, any> | null;
  update(properties: Record<string, any>): Promise<void>;
  delete(): Promise<void>;
  getBundleLocation(): string | null;
  setBundleLocation(location: string | null): Promise<void>;
}

export interface ManagedService {
  updated(properties: Record<string, any> | null): void | Promise<void>;
}

export interface ManagedServiceFactory {
  getName(): string;
  updated(pid: string, properties: Record<string, any>): void | Promise<void>;
  deleted(pid: string): void | Promise<void>;
}
