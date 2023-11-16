import type { Bundle, BundleManifestHeaders, BundleState, FrameworkListener } from '@pandino/pandino-api';

export interface Framework extends Bundle {
  init(...listeners: FrameworkListener[]): Promise<void>;
  start(options?: BundleState): Promise<void>;
  stop(options?: BundleState): Promise<void>;
  uninstall(): Promise<void>;
  update(headers: BundleManifestHeaders, bundle?: Bundle): Promise<void>;
  getSymbolicName(): string;
}
