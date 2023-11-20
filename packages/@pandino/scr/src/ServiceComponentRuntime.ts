import type { BundleContext } from '@pandino/pandino-api';
import type { ComponentConfiguration } from '@pandino/scr-api';

export interface ServiceComponentRuntime {
  processComponent(target: any, bundleContext: BundleContext): void;
  processComponents(): void;
  releaseComponent(component: ComponentConfiguration<any>): void;
  releaseComponents(): void;
}
