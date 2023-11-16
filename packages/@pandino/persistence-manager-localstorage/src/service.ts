import type { PersistenceManager } from '@pandino/persistence-manager-api';
import type { Logger, ServiceProperties } from '@pandino/pandino-api';

export class LocalstoragePersistenceManager implements PersistenceManager {
  private readonly storage: Storage;
  private readonly logger: Logger;
  private readonly managedKeysKey: string;

  constructor(storage: Storage, managedKeysKey: string, logger: Logger) {
    this.storage = storage;
    this.managedKeysKey = managedKeysKey;
    this.logger = logger;

    this.initManagedKeys();
  }

  exists(pid: string): boolean {
    const value = this.storage.getItem(pid);
    return value !== null && value !== undefined;
  }

  delete(pid: string): void {
    if (this.exists(pid)) {
      if (this.isKeyManaged(pid)) {
        this.storage.removeItem(pid);
        this.removeFromManagedKeys(pid);
      } else {
        this.logger.warn(`Skipping deletion of PID: ${pid}, because it's not in the list of Managed Keys!`);
      }
    }
  }

  getProperties(): ServiceProperties[] {
    const props: ServiceProperties[] = [];
    const managedKeys = this.getManagedKeys();
    for (const pid of managedKeys) {
      try {
        const value = this.storage.getItem(pid);
        if (value) {
          const parsed = JSON.parse(value) as ServiceProperties;
          props.push(parsed);
        }
      } catch (err) {
        this.logger.error(`Error while trying to parse persisted Configuration for PID: ${pid}!`);
      }
    }
    return props;
  }

  load(pid: string): ServiceProperties | undefined {
    if (this.exists(pid)) {
      if (this.isKeyManaged(pid)) {
        const value = this.storage.getItem(pid);
        return value ? JSON.parse(value) : undefined;
      } else {
        this.logger.warn(`Cannot load Configuration for PID: ${pid}, because it's not in the list of Managed Keys!`);
      }
    }
    return undefined;
  }

  store(pid: string, properties: ServiceProperties): void {
    if (!this.isKeyManaged(pid)) {
      this.logger.debug(`Adding new PID to Managed Keys: ${pid}`);
      this.addToManagedKeys(pid);
    }
    try {
      const value = JSON.stringify(properties);
      this.storage.setItem(pid, value);
    } catch (err) {
      this.logger.error(`Cannot store Configuration for PID: ${pid}: ${err}`);
    }
  }

  getManagedKeys(): string[] {
    try {
      const item = this.storage.getItem(this.managedKeysKey);
      return item ? JSON.parse(item) : [];
    } catch (err) {
      this.logger.error(`Could not load contents of Managed Keys!`);
      return [];
    }
  }

  private isKeyManaged(key: string): boolean {
    return this.getManagedKeys().includes(key);
  }

  private initManagedKeys(...keys: string[]): void {
    if (!this.storage.getItem(this.managedKeysKey)) {
      this.storage.setItem(this.managedKeysKey, JSON.stringify(keys));
    }
  }

  private addToManagedKeys(key: string): void {
    try {
      const catalogue = this.getManagedKeys();
      if (!catalogue.find((k) => k === key)) {
        catalogue.push(key);
      }
      this.storeManagedKeys(catalogue);
    } catch (err) {
      this.logger.error(`Could not add "${key}" to Managed Keys: ${err}`);
    }
  }

  private removeFromManagedKeys(key: string): void {
    try {
      const catalogue = this.getManagedKeys();
      const idx = catalogue.findIndex((k) => k === key);
      if (idx > -1) {
        catalogue.splice(idx, 1);
      }
      this.storeManagedKeys(catalogue);
    } catch (err) {
      this.logger.error(`Could not remove "${key}" from Managed Keys: ${err}`);
    }
  }

  private storeManagedKeys(keys: string[]): void {
    try {
      this.storage.setItem(this.managedKeysKey, JSON.stringify(keys));
    } catch (err) {
      this.logger.error(`Could not store contents of Managed Keys: ${err}`);
    }
  }
}
