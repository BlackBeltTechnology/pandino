import {
  Bundle,
  BundleCapability,
  BundleEventType,
  BundleManifestHeaders,
  BundleReference,
  BundleState,
} from './bundle';
import { Requirement } from './resource';

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

export interface FrameworkWiring extends BundleReference {
  refreshBundles(bundles: Bundle[], ...listeners: FrameworkListener[]): void;
  resolveBundles(bundles: Bundle[]): boolean;
  getRemovalPendingBundles(): Bundle[];
  findProviders(requirement: Requirement): BundleCapability[];
  start(): Promise<void>;
  stop(): Promise<void>;
}
