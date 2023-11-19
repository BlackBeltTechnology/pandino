import type { BundleContext } from '@pandino/pandino-api';
import { Component } from './Component';

export interface ServiceComponentRuntime {
  processComponent(target: any, bundleContext: BundleContext): void;
  processComponents(): void;
  releaseComponent(component: Component): void;
  releaseComponents(): void;
}
