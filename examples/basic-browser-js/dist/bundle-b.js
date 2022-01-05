export default class BundleActivator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);

    this.logger.log('Bundle B - Activator');

    context.registerService('@pandino/bundle-b/StringInverter', stringInverterImpl);

    return Promise.resolve();
  }

  async stop(context) {
    context.ungetService(this.loggerReference);

    return Promise.resolve();
  }
}

export const stringInverterImpl = (str) => {
  return str.split('').reverse().join('');
};
