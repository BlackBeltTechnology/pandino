export default class Activator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);
    this.configAdminReference = context.getServiceReference('@pandino/configuration-management/ConfigurationAdmin');
    this.configAdmin = context.getService(this.configAdminReference);

    this.logger.log('ConfigAdmin Manager - Activator');

    const mstConfig = this.configAdmin.getConfiguration('test.pid');
    if (!mstConfig.getProperties()) {
      mstConfig.update({
        prop1: 'yayy, updated3333!',
        prop2: true,
      });
    }

    window.setTimeout(() => {
      mstConfig.update({
        prop1: 'delayed YAYY!',
        prop2: true,
      });
    }, 5000);
  }

  async stop(context) {
    context.ungetService(this.loggerReference);
    context.ungetService(this.configAdminReference);
  }
}
