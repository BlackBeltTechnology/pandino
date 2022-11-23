export default class CustomActionActivator {
  async start(context) {
    this.registration = context.registerService('@example/click-action', {
      click: (text) => alert(text.split('').reverse().join('')),
    }, {
      'service.ranking': 1,
    });
  }

  async stop(context) {
    this.registration.unregister();
  }
}
