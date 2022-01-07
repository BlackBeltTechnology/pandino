export default class ExpressListActivator {
  async start(context) {
    this.loggerReference = context.getServiceReference('@pandino/pandino/Logger');
    this.logger = context.getService(this.loggerReference);
    this.logger.log('ExpressList - Activator');

    this.expressApp = null;
    const appExtractor = (app) => {
      this.expressApp = app;
    };
    this.factory = new ResourceManager(this.logger, appExtractor);
    this.registration = context.registerService('@pandino/nodejs-simple-js/resource-manager', this.factory);
  }

  stop(context) {
    this.logger.log('ExpressList - Stopping...');
    // TODO: impl proper route de-registration

    context.ungetService(this.loggerReference);
    this.registration.unregister();
  }
}

/**
 * "implements" @pandino/nodejs-simple-js/resource-manager
 */
class ResourceManager {
  constructor(logger, appExtractor) {
    this.logger = logger;
    this.appExtractor = appExtractor;
  }

  init(expressApp) {
    this.logger.info('Adding Resource "express-list" to Express...');
    this.appExtractor(expressApp);
    expressApp.get('/list', (req, res) => {
      res.send(JSON.stringify([
        { id: 1, title: 'Test...' },
        { id: 2, title: 'Hello!' },
      ]));
    });
  }
}
