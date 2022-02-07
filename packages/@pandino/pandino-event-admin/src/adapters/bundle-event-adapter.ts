import { BundleContext, BundleEvent, BundleListener } from '@pandino/pandino-api';
import { BUNDLE_SYMBOLICNAME, EVENT, EventAdmin } from '@pandino/pandino-event-api';
import { BUNDLE_EVENT_INTERFACE_KEY } from '@pandino/pandino-event-api';
import { AbstractAdapter } from './abstract-adapter';
import { eventFactoryImpl } from '../event-factory-impl';

export class BundleEventAdapter extends AbstractAdapter implements BundleListener {
  constructor(context: BundleContext, eventAdmin: EventAdmin) {
    super(eventAdmin);
    context.addBundleListener(this);
  }

  override destroy(context: BundleContext): void {
    context.removeBundleListener(this);
  }

  bundleChanged(event: BundleEvent): void {
    const properties = {
      [EVENT]: event,
      [BUNDLE_SYMBOLICNAME]: event.getBundle().getSymbolicName(),
      'bundle.id': event.getBundle().getBundleId(),
      bundle: event.getBundle(),
    };

    let topic = `${BUNDLE_EVENT_INTERFACE_KEY}/`;

    switch (event.getType()) {
      case 'INSTALLED':
        topic += 'INSTALLED';
        break;
      case 'STARTED':
        topic += 'STARTED';
        break;
      case 'STOPPED':
        topic += 'STOPPED';
        break;
      case 'UPDATED':
        topic += 'UPDATED';
        break;
      case 'UNINSTALLED':
        topic += 'UNINSTALLED';
        break;
      case 'RESOLVED':
        topic += 'RESOLVED';
        break;
      case 'UNRESOLVED':
        topic += 'UNRESOLVED';
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
