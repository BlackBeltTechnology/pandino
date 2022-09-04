class BundleAActivator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);
    this.inverterReference = context.getServiceReference('@pandino/bundle-b/StringInverter');
    this.inverter = context.getService(this.inverterReference);

    this.logger.log('Bundle A - Activator');

    this.logger.log(`Testing inverter: ${this.inverter('Please invert this!')}`);

    return Promise.resolve();
  }

  stop(context) {
    context.ungetService(this.loggerReference);
    context.ungetService(this.inverterReference);
    return Promise.resolve();
  }
}

module.exports = BundleAActivator;
