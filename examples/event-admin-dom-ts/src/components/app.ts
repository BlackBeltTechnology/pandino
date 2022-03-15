import {BundleContext} from "@pandino/pandino-api";
import {Content} from "./content";
import {Configuration} from "./configuration";

export class App extends HTMLElement {
  private readonly bundleContext: BundleContext;

  constructor(bundleContext: BundleContext) {
    super();
    this.bundleContext = bundleContext;
  }

  connectedCallback() {
    const content = new Content(this.bundleContext);
    const configuration = new Configuration(this.bundleContext);
    const wrapper = document.createElement('div');
    wrapper.classList.add('wrapper');
    wrapper.appendChild(content);
    wrapper.appendChild(configuration);

    this.innerHTML = '';
    this.appendChild(wrapper);
  }
}

customElements.define('my-app', App);
