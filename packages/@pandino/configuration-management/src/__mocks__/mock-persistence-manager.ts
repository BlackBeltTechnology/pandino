import type { PersistenceManager } from '@pandino/persistence-manager-api';
import type { ServiceProperties } from '@pandino/pandino-api';

export class MockPersistenceManager implements PersistenceManager {
  private readonly map: Map<string, ServiceProperties> = new Map<string, ServiceProperties>();

  constructor(json: string) {
    const parsed = JSON.parse(json || '{}');
    Object.keys(parsed).forEach((key: string) => {
      this.map.set(key, parsed[key]);
    });
  }

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

  dump(): string {
    let output: any = {};
    this.map.forEach((value: ServiceProperties, key: string) => {
      output[key] = value;
    });
    return JSON.stringify(output, null, 4);
  }
}
