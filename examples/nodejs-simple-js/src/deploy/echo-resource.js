export default class BundleActivator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);

    this.logger.log('Echo Resource - Activator');

    context.registerService('@pandino/echo-resource/StringInverter', stringInverterImpl);

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
