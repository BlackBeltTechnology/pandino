import { ComponentInstance } from '@pandino/scr-api';

export class ComponentInstanceImpl<S> implements ComponentInstance<S> {
  private readonly clazz: new (...args: any[]) => S;
  private readonly instance: S;

  constructor(clazz: new (...args: any[]) => S) {
    this.clazz = clazz;
    this.instance = new this.clazz();
  }

  dispose(): void {
    // TODO
  }

  getInstance(): S {
    return this.instance;
  }
}
