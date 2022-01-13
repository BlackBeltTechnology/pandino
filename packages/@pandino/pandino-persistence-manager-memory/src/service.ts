import { PersistenceManager } from '@pandino/pandino-persistence-manager-api';
import { ServiceProperties } from '@pandino/pandino-api';

export class InMemoryPersistenceManager implements PersistenceManager {
  private readonly map: Map<string, ServiceProperties> = new Map<string, ServiceProperties>();

  delete(pid: string): void {
    this.map.delete(pid);
  }

  exists(pid: string): boolean {
    return this.map.has(pid);
  }

  getProperties(): ServiceProperties[] {
    return Array.from(this.map.values());
  }

  load(pid: string): ServiceProperties | undefined {
    return this.map.get(pid);
  }

  store(pid: string, properties: ServiceProperties): void {
    this.map.set(pid, properties);
  }
}
