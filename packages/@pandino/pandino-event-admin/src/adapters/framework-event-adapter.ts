import { BundleContext, FrameworkEvent, FrameworkListener } from '@pandino/pandino-api';
import { BUNDLE_SYMBOLICNAME, EVENT, EventAdmin, FRAMEWORK_EVENT_INTERFACE_KEY } from '@pandino/pandino-event-api';
import { AbstractAdapter } from './abstract-adapter';
import { eventFactoryImpl } from '../event-factory-impl';

export class FrameworkEventAdapter extends AbstractAdapter implements FrameworkListener {
  constructor(context: BundleContext, admin: EventAdmin) {
    super(admin);
    context.addFrameworkListener(this);
  }

  override destroy(bundleContext: BundleContext): void {
    bundleContext.removeFrameworkListener(this);
  }

  frameworkEvent(event: FrameworkEvent): void {
    const properties = {
      [EVENT]: event,
      [BUNDLE_SYMBOLICNAME]: event.getBundle().getSymbolicName(),
      'bundle.id': event.getBundle().getBundleId(),
      bundle: event.getBundle(),
    };

    let topic = `${FRAMEWORK_EVENT_INTERFACE_KEY}/`;

    switch (event.getType()) {
      case 'STARTED':
        topic += 'STARTED';
        break;
      case 'ERROR':
        topic += 'ERROR';
        break;
      default:
        return; // IGNORE EVENT
    }

    try {
      this.getEventAdmin().postEvent(eventFactoryImpl(topic, properties));
    } catch (err) {
      // This is o.k. - indicates that we are stopped.
    }
  }
}
