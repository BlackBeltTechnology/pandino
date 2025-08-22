import type { BundleActivator, BundleContext, LogService, ServiceReference } from '@pandino/pandino';

class Activator implements BundleActivator {
  private logServiceRef?: ServiceReference<LogService>;
  private logger?: LogService | null;

  async start(context: BundleContext) {
    const bundle = context.getBundle();
    const headers = bundle.getHeaders();
    this.logServiceRef = context.getServiceReference<LogService>('LogService')!;
    this.logger = context.getService(this.logServiceRef);
    this.logger?.info(`Activator start, ${headers['Bundle-SymbolicName']}, ${headers['Bundle-Version']}`);
  }
  async stop(context: BundleContext) {
    const bundle = context.getBundle();
    this.logger?.info(`Activator stop', ${bundle.getSymbolicName()}`);
    if (this.logServiceRef) {
      context.ungetService(this.logServiceRef);
      this.logServiceRef = undefined;
      this.logger = null;
    }
  }
}

export default new Activator();
