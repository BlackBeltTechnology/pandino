export default class AboutActivator {
  constructor() {
    this.reg = null;
  }

  async start(context) {
    this.reg = context.registerService('app.feature', new FeatureProvider(), {
      featureName: 'about',
    })

    return Promise.resolve();
  }

  stop(context) {
    this.reg.unregister();
    return Promise.resolve();
  }
}

class FeatureProvider {
  getPageComponent() {
    return AboutComponent;
  }

  getRoutePath() {
    return '/about';
  }

  getMenuInfo() {
    return {
      label: 'About',
      path: '/about'
    };
  }
}

class AboutComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
        <h1>About</h1>
        <p>Plain old about page with nothing fancy...</p>
        <ol>
          <li>one</li>
          <li>two</li>
          <li>three</li>
        </ol>
    `;
  }
}

customElements.define('app-feature-about', AboutComponent);
