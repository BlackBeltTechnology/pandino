import { Bundle, BundleEventType, BundleManifestHeaders, BundleState } from './bundle';

export type FrameworkEventType = BundleEventType | 'ERROR';

export interface Framework extends Bundle {
  init(...listeners: FrameworkListener[]): Promise<void>;
  start(options?: BundleState): Promise<void>;
  stop(options?: BundleState): Promise<void>;
  uninstall(): Promise<void>;
  update(headers: BundleManifestHeaders, bundle?: Bundle): Promise<void>;
  getSymbolicName(): string;
  registerDocumentDefinedManifests(): Promise<void>;
}

export interface FrameworkListener {
  frameworkEvent(event: FrameworkEvent): void;
}

export interface FrameworkEvent {
  getBundle(): Bundle;
  getType(): FrameworkEventType;
  getError(): Error;
}
