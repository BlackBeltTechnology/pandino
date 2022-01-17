export default class DashboardActivator {
  constructor() {
    this.reg = null;
  }

  async start(context) {
    this.reg = context.registerService('app.feature', new FeatureProvider(), {
      featureName: 'dashboard',
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
    return DashboardComponent;
  }

  getRoutePath() {
    return '/';
  }

  getMenuInfo() {
    return {
      label: 'Dashboard',
      path: '/'
    };
  }
}

class DashboardComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `<h1>Dashboard</h1><p>Content from the Dashboard, yayy!</p>`;
  }
}

customElements.define('app-feature-dashboard', DashboardComponent);
