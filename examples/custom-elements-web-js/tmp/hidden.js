export default class HiddenActivator {
  constructor() {
    this.reg = null;
  }

  async start(context) {
    this.reg = context.registerService('app.feature', new FeatureProvider(), {
      featureName: 'hidden',
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
    return HiddenComponent;
  }

  getRoutePath() {
    return '/hidden';
  }
}

class HiddenComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
        <h1>Super secret content!</h1>
        <iframe width="932" height="699" src="https://www.youtube.com/embed/bxqLsrlakK8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay=1; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
  }
}

customElements.define('app-feature-hidden', HiddenComponent);
