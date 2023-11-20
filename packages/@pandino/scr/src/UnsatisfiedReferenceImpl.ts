import { UnsatisfiedReference } from '@pandino/scr-api';

export class UnsatisfiedReferenceImpl<S> implements UnsatisfiedReference {
  private readonly name: string;
  private readonly target?: string;

  constructor(name: string, target?: string) {
    this.name = name;
    this.target = target;
  }

  getName(): string {
    return this.name;
  }

  getTarget(): string | undefined {
    return this.target;
  }
}
