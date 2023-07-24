const STRING_INVERTER_INTERFACE_KEY = '@example/string-inverter/StringInverter';

class StringInverterImpl {
  invert(str) {
    return str.split('').reverse().join('');
  }
}

export default class Activator {
  inverterRegistration;

  async start(context) {
    this.inverterRegistration = context.registerService(STRING_INVERTER_INTERFACE_KEY, new StringInverterImpl());
  }

  async stop(context) {
    this.inverterRegistration.unregister();
  }
}
