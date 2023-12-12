import { REFERENCE_KEY_SERVICE, REFERENCE_KEY_TARGET } from '@pandino/scr-api';
import type { InternalReferenceMetaData, SatisfiedReference } from '@pandino/scr-api';
import type { ServiceReference } from '@pandino/pandino-api';

export class SatisfiedReferenceImpl<S> implements SatisfiedReference {
  private readonly name: string;
  private readonly target?: string;
  private boundServices: ServiceReference<S>[] = [];

  constructor(name: string, target?: string, boundServices?: ServiceReference<S>[]) {
    this.name = name;
    this.target = target;
    if (Array.isArray(boundServices)) {
      this.boundServices = boundServices;
    }
  }

  addBoundService(boundService: ServiceReference<S>): void {
    this.boundServices.push(boundService);
  }

  setBoundServices(boundServices: ServiceReference<S>[]): void {
    this.boundServices = boundServices;
  }

  getBoundServices(): ServiceReference<S>[] {
    return this.boundServices;
  }

  getName(): string {
    return this.name;
  }

  getTarget(): string | undefined {
    return this.target;
  }

  equals(refMeta: InternalReferenceMetaData): boolean {
    return this.name === refMeta[REFERENCE_KEY_SERVICE] && this.target === refMeta[REFERENCE_KEY_TARGET];
  }
}
