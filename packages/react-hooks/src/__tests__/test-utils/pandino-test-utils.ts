import { LogLevel, OSGiBootstrap, OSGiFramework, type BundleContext, type ServiceReference } from '@pandino/pandino';

export class PandinoTestUtils {
  private framework: OSGiFramework | null = null;
  private bundleContext: BundleContext | null = null;
  private registeredServices: Array<{ reference: ServiceReference<any>; service: any }> = [];

  async initialize(): Promise<void> {
    const bootstrap = new OSGiBootstrap({
      frameworkLogLevel: LogLevel.INFO,
    });

    this.framework = await bootstrap.start();
    this.bundleContext = this.framework.getBundleContext();
  }

  getBundleContext(): BundleContext {
    if (!this.bundleContext) {
      throw new Error('Pandino framework not initialized. Call initialize() first.');
    }
    return this.bundleContext;
  }

  getFramework(): OSGiFramework {
    if (!this.framework) {
      throw new Error('Pandino framework not initialized. Call initialize() first.');
    }
    return this.framework;
  }

  registerService<T>(
    serviceClass: string | Function,
    serviceImpl: T,
    properties: Record<string, any> = {},
  ): ServiceReference<T> {
    if (!this.bundleContext) {
      throw new Error('Pandino framework not initialized. Call initialize() first.');
    }

    const registration = this.bundleContext.registerService(serviceClass, serviceImpl, properties);
    const reference = registration.getReference();

    this.registeredServices.push({ reference, service: serviceImpl });

    return reference;
  }

  async cleanup(): Promise<void> {
    this.registeredServices = [];

    if (this.framework) {
      await this.framework.stop();
      this.framework = null;
      this.bundleContext = null;
    }
  }

  createContextValue() {
    if (!this.framework || !this.bundleContext) {
      throw new Error('Pandino framework not initialized. Call initialize() first.');
    }

    return {
      framework: this.framework,
      bundleContext: this.bundleContext,
      isInitialized: true,
      error: null,
    };
  }
}
