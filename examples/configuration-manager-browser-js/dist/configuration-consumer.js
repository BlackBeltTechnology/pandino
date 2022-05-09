export default class BundleActivator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);

    this.logger.log('Configuration Consumer - Activator');

    const mst = new ManagedServiceTest(this.logger);
    this.registration = context.registerService('@pandino/configuration-management/ManagedService', mst, {
      'service.pid': 'test.pid'
    });

    return Promise.resolve();
  }

  async stop(context) {
    context.ungetService(this.loggerReference);
    context.unregisterService(this.registration);

    return Promise.resolve();
  }
}

class ManagedServiceTest {
  constructor(logger) {
    this.logger = logger;
    this.properties = this.getDefaultProperties();
  }

  updated(properties) {
    if (properties) {
      this.properties = {
        ...this.properties,
        ...properties,
      };
    }
    this.logger.info(`Updated properties for ManagedServiceTest: ${JSON.stringify(this.properties)}`);
  }

  getDefaultProperties() {
    return {
      prop1: 'yayy',
      prop2: true,
    };
  }
}
