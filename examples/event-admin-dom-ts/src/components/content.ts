import {BundleContext, ServiceReference, ServiceRegistration} from "@pandino/pandino-api";
import {
  EVENT_ADMIN_INTERFACE_KEY,
  EVENT_HANDLER_INTERFACE_KEY,
  EventAdmin,
  EventHandler
} from "@pandino/event-api";
import {TOPIC} from "./configuration-changed-event";

interface Entry {
  birthDate: Date,
  firstName: string,
  lastName: string,
}

type DateLocale = 'en-US' | 'hu-HU';

export class Content extends HTMLElement {
  private readonly bundleContext: BundleContext;
  private eventAdminReference: ServiceReference<EventAdmin>;
  private eventAdmin: EventAdmin;
  private registration: ServiceRegistration<EventHandler>;
  private handler: EventHandler;
  private locale: DateLocale = 'en-US';
  private readonly data: Entry[] = [
    {
      birthDate: new Date(1966, 12, 7),
      firstName: 'Sean',
      lastName: 'McSayin',
    },
    {
      birthDate: new Date(1995, 3, 2),
      firstName: 'Lucy',
      lastName: 'Evil',
    },
    {
      birthDate: new Date(1987, 11, 20 ),
      firstName: 'Josh',
      lastName: 'Bertran',
    },
  ];

  constructor(bundleContext: BundleContext) {
    super();
    this.bundleContext = bundleContext;
  }

  connectedCallback() {
    this.eventAdminReference = this.bundleContext.getServiceReference(EVENT_ADMIN_INTERFACE_KEY);
    this.eventAdmin = this.bundleContext.getService(this.eventAdminReference);
    this.handler = {
      handleEvent: async (event) => {
        this.locale = event.getProperty('configuration');
        this.draw();
      },
    };
    this.registration = this.bundleContext.registerService(EVENT_HANDLER_INTERFACE_KEY, this.handler, {
      'event.topics': TOPIC,
    });

    this.draw();
  }

  disconnectedCallback() {
    if (this.eventAdminReference) {
      this.bundleContext.ungetService(this.eventAdminReference);
    }
    this.registration.unregister();
  }

  draw() {
    const formatter = new Intl.DateTimeFormat(this.locale);
    this.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Birth Date</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
            ${this.data.map((d) => `
                <tr>
                    <td>${formatter.format(d.birthDate)}</td>
                    <td>${d.lastName} ${d.firstName}</td>
                </tr>
            `).join('')}
        </tbody>
      </table>
    `;
  }
}

customElements.define('my-content', Content);
