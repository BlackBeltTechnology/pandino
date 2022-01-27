import { Bundle, BundleContext, BundleManifestHeaders, BundleState, ServiceReference } from '@pandino/pandino-api';
import { SemVer } from 'semver';
import { MockBundleContext } from './mock-bundle-context';

export class MockBundle implements Bundle {
  private readonly context: BundleContext;
  private readonly location: string;
  private readonly symbolicName: string;
  private readonly version: SemVer;

  constructor(context: MockBundleContext, location: string, symbolicName: string, version: SemVer) {
    this.context = context;
    this.location = location;
    this.symbolicName = symbolicName;
    this.version = version;
    context.setBundle(this);
  }

  getBundleContext(): BundleContext {
    return this.context;
  }

  getBundleId(): number {
    return 0;
  }

  getHeaders(): BundleManifestHeaders {
    return undefined;
  }

  getLocation(): string {
    return this.location;
  }

  getRegisteredServices(): ServiceReference<any>[] {
    return [];
  }

  getServicesInUse(): ServiceReference<any>[] {
    return [];
  }

  getState(): BundleState {
    return undefined;
  }

  getSymbolicName(): string {
    return this.symbolicName;
  }

  getUniqueIdentifier(): string {
    return '';
  }

  getVersion(): SemVer {
    return this.version;
  }

  start(options?: BundleState): Promise<void> {
    return Promise.resolve(undefined);
  }

  stop(options?: BundleState): Promise<void> {
    return Promise.resolve(undefined);
  }

  uninstall(): Promise<void> {
    return Promise.resolve(undefined);
  }

  update(headers: BundleManifestHeaders, bundle?: Bundle): Promise<void> {
    return Promise.resolve(undefined);
  }
}
