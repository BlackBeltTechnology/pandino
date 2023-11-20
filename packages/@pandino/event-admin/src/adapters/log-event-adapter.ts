import {
  BUNDLE_SYMBOLICNAME,
  BundleContext,
  OBJECTCLASS,
  SERVICE_ID,
  SERVICE_PID,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
} from '@pandino/pandino-api';
import { LOG_READER_SERVICE_INTERFACE_KEY } from '@pandino/log-api';
import type { LogEntry, LogListener, LogReaderService } from '@pandino/log-api';
import { BUNDLE_ID, EventAdmin, EventFactory, LOG_EVENT_INTERFACE_KEY, MESSAGE, SERVICE, SERVICE_OBJECTCLASS, TIMESTAMP } from '@pandino/event-api';
import { AbstractAdapter } from './abstract-adapter';

export class LogEventAdapter extends AbstractAdapter implements ServiceListener {
  private readonly eventFactory: EventFactory;
  private readonly context: BundleContext;
  // @ts-ignore
  private logListener: LogListener;

  constructor(context: BundleContext, admin: EventAdmin, eventFactory: EventFactory) {
    super(admin);
    this.context = context;
    this.eventFactory = eventFactory;

    try {
      context.addServiceListener(this, `(${OBJECTCLASS}=${LOG_READER_SERVICE_INTERFACE_KEY})`);

      const refs: ServiceReference<LogReaderService>[] = context.getServiceReferences(LOG_READER_SERVICE_INTERFACE_KEY);

      if (refs && refs.length) {
        for (let i = 0; i < refs.length; i++) {
          const logReader = context.getService(refs[i]);

          if (logReader) {
            logReader.addLogListener(this.getLogListener());
          }
        }
      }
    } catch (err) {
      // This never happens
    }
  }

  destroy(bundleContext: BundleContext): void {
    bundleContext.removeServiceListener(this);
  }

  serviceChanged(event: ServiceEvent): void {
    if (event.getType() === 'REGISTERED') {
      const logReader: LogReaderService = this.context.getService(event.getServiceReference());

      if (logReader) {
        logReader.addLogListener(this.getLogListener());
      }
    }
  }

  private getLogListener(): LogListener {
    if (this.logListener) {
      return this.logListener;
    }

    this.logListener = {
      logged: (entry: LogEntry) => {
        // This is where the assembly as specified in 133.6.6 OSGi R4
        // compendium is taking place (i.e., the log entry is adapted to
        // an event and posted via the EventAdmin)

        const properties: Record<string, any> = {};

        let bundle = entry.getBundle();

        if (bundle) {
          properties[BUNDLE_ID] = bundle.getBundleId();
          properties['bundle'] = bundle;
          properties[BUNDLE_SYMBOLICNAME] = bundle.getSymbolicName();
        }

        properties['log.entry'] = entry;
        properties['log.level'] = entry.getLevel();
        properties[MESSAGE] = entry.getMessage() ? entry.getMessage() : '';
        properties[TIMESTAMP] = entry.getTime();

        const service: ServiceReference<any> = entry.getServiceReference();

        if (service) {
          properties[SERVICE] = service;
          properties[SERVICE_ID] = service.getProperty(SERVICE_ID);
          properties[SERVICE_OBJECTCLASS] = service.getProperty(OBJECTCLASS);

          const pid = service.getProperty(SERVICE_PID);
          if (pid) {
            properties[SERVICE_PID] = pid;
          }
        }

        let topic = `${LOG_EVENT_INTERFACE_KEY}/`;

        switch (entry.getLevel()) {
          case 'ERROR':
            topic += 'ERROR';
            break;
          case 'WARNING':
            topic += 'WARNING';
            break;
          case 'INFO':
            topic += 'INFO';
            break;
          case 'DEBUG':
            topic += 'DEBUG';
            break;
          default:
            topic += 'OTHER';
            break;
        }

        try {
          this.getEventAdmin().postEvent(this.eventFactory.build(topic.toString(), properties));
        } catch (err) {
          // This is o.k. - indicates that we are stopped.
        }
      },
    };

    return this.logListener;
  }
}
