import { BundleContext, SERVICE_PID, ServiceProperties } from '@pandino/pandino-api';
import { PersistenceManager } from '@pandino/persistence-manager-api';
import { ConfigurationImpl } from './configuration-impl';
import { ConfigurationManager } from './configuration-manager';

export class ConfigurationCache {
  private readonly cache: Map<string, ConfigurationImpl> = new Map<string, ConfigurationImpl>();
  private readonly persistenceManager: PersistenceManager;
  private readonly cm: ConfigurationManager;
  private readonly context: BundleContext;

  constructor(context: BundleContext, pm: PersistenceManager, cm: ConfigurationManager) {
    this.context = context;
    this.persistenceManager = pm;
    this.cm = cm;

    this.persistenceManager.getProperties().forEach((props: ServiceProperties) => {
      const configuration = new ConfigurationImpl(
        this.cm,
        props[SERVICE_PID],
        this.context.getBundle().getLocation(),
        props,
      );
      this.cache.set(props[SERVICE_PID], configuration);
    });
  }

  has(pid: string): boolean {
    if (this.cache.has(pid)) {
      return true;
    }
    const stored = this.persistenceManager.load(pid);
    if (stored) {
      this.cache.set(pid, new ConfigurationImpl(this.cm, pid, this.context.getBundle().getLocation(), stored));
      return true;
    }
    return false;
  }

  get(pid: string): ConfigurationImpl | undefined {
    if (this.has(pid)) {
      return this.cache.get(pid);
    }

    return undefined;
  }

  set(pid: string, configuration: ConfigurationImpl): void {
    this.persistenceManager.store(pid, configuration.getProperties());
    this.cache.set(pid, configuration);
  }

  values(): ConfigurationImpl[] {
    return Array.from(this.cache.values());
  }

  delete(pid: string): void {
    if (this.persistenceManager.exists(pid)) {
      this.persistenceManager.delete(pid);
    }
    if (this.cache.has(pid)) {
      this.cache.delete(pid);
    }
  }
}
