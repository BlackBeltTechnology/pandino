import type { BundleContext } from '@pandino/pandino-api';
import type { ComponentRegistrar } from './interfaces';

export interface DecoratedQueue {
  add(target: any): void;
  init(context: BundleContext, registrar: ComponentRegistrar): void;
  isInitialized(): boolean;
}

export class DecoratedQueueImpl implements DecoratedQueue {
  private decorated: Map<any, boolean> = new Map<any, boolean>();
  private registrar?: ComponentRegistrar;
  private context?: BundleContext;

  add(target: any): void {
    if (!this.decorated.has(target)) {
      this.decorated.set(target, false);
    }
    this.processPending();
  }

  init(context: BundleContext, registrar: ComponentRegistrar): void {
    if (!this.isInitialized()) {
      this.registrar = registrar;
      this.context = context;
      this.processPending();
    }
  }

  isInitialized(): boolean {
    return !!this.registrar && !!this.context;
  }

  private processPending(): void {
    if (this.isInitialized()) {
      const processedTargets: any[] = [];
      for (const [target, processed] of this.decorated) {
        if (!processed) {
          this.registrar!.registerComponent(target, this.context!);
        }
        processedTargets.push(target);
      }
      for (const t of processedTargets) {
        this.decorated.delete(t);
      }
    }
  }
}
