export default class Activator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);
    this.fetcherReference = context.getServiceReference('@pandino/pandino/Fetcher');
    this.fetcher = context.getService(this.fetcherReference);
    this.inverterReference = context.getServiceReference('@pandino/bundle-b/StringInverter');
    this.inverter = context.getService(this.inverterReference);

    this.logger.log('Bundle A - Activator');

    this.logger.log(`Testing inverter: ${this.inverter('Please invert this!')}`);
    this.testFetch();

    return Promise.resolve();
  }

  stop(context) {
    context.ungetService(this.loggerReference);
    context.ungetService(this.fetcherReference);
    context.ungetService(this.inverterReference);
    return Promise.resolve();
  }

  testFetch() {
    this.fetcher
      .fetch('https://reqres.in/api/users/2')
      .then(res => this.logger.log(JSON.stringify(res.data, null, 4)));
  }
}
