import {BundleContext, ServiceReference} from "@pandino/pandino-api";
import {
  EVENT_ADMIN_INTERFACE_KEY,
  EVENT_FACTORY_INTERFACE_KEY,
  EventAdmin,
  EventFactory
} from "@pandino/event-api";
import {ConfigurationChangedProperties, TOPIC} from "./configuration-changed-event";

export class Configuration extends HTMLElement {
  private readonly bundleContext: BundleContext;
  private eventAdminReference: ServiceReference<EventAdmin>;
  private eventAdmin: EventAdmin;
  private eventFactoryReference: ServiceReference<EventFactory>;
  private eventFactory: EventFactory;

  constructor(bundleContext: BundleContext) {
    super();
    this.bundleContext = bundleContext;
  }

  connectedCallback() {
    this.eventAdminReference = this.bundleContext.getServiceReference(EVENT_ADMIN_INTERFACE_KEY);
    this.eventAdmin = this.bundleContext.getService(this.eventAdminReference);
    this.eventFactoryReference = this.bundleContext.getServiceReference(EVENT_FACTORY_INTERFACE_KEY);
    this.eventFactory = this.bundleContext.getService(this.eventFactoryReference);

    this.innerHTML = `
      <div class="configuration">
        <h3>DateTime format:</h3>
        <select id="config-locale">
            <option value="en-US" selected>en-US</option>
            <option value="hu-HU">hu-HU</option>
        </select>
        <button id="config-update">Update!</button>
      </div>
    `;
    this.querySelector('#config-update').addEventListener('click', this.updateClicked.bind(this));
  }

  disconnectedCallback() {
    if (this.eventAdminReference) {
      this.bundleContext.ungetService(this.eventAdminReference);
    }
    if (this.eventFactoryReference) {
      this.bundleContext.ungetService(this.eventFactoryReference);
    }
    this.querySelector('#config-update').removeEventListener('click', this.updateClicked.bind(this));
  }

  private updateClicked() {
    const element: HTMLSelectElement = this.querySelector('#config-locale');
    const event = this.eventFactory.build<ConfigurationChangedProperties>(TOPIC, {
      configuration: element.value,
    });

    this.eventAdmin.postEvent(event);
  }
}

customElements.define('my-configuration', Configuration);
