export default class AppWire extends HTMLElement {
  constructor(pandinoContext) {
    super();
    this.routes = [];
    this.menu = [];

    this.pandinoContext = pandinoContext;
    this.pandinoContext.addServiceListener({
      serviceChanged: (event) => {
        if (event.getType() === 'REGISTERED') {
          const ref = event.getServiceReference();
          const svc = pandinoContext.getService(ref);
          const serviceId = ref.getProperty('service.id');
          if (typeof svc.getMenuInfo === 'function') {
            this.addMenu(serviceId, svc.getMenuInfo());
          }
          this.addRoute(serviceId, svc.getRoutePath(), svc.getPageComponent());
          this.paint();
        }
      },
    }, '(objectClass=app.feature)');

    window.addEventListener('load', this.route.bind(this));
    window.addEventListener('hashchange', this.route.bind(this));
  }

  route(event) {
    this.paint();
  }

  addMenu(serviceId, menuProps) {
    this.menu.push({
      ...menuProps,
      serviceId,
    });
    this.menu.sort((a, b) => a.label.localeCompare(b.label));
  }

  addRoute(serviceId, path, component) {
    this.routes.push({
      path,
      component,
      serviceId,
    });
  }

  connectedCallback() {
    this.paint();
  }

  paint() {
    this.innerHTML = `
      <div class="root">
        <div class="menu">
            <h3>Pandino</h3>
            <ul>
            ${this.menu.map(m => `
                <li class="${this.menuActiveClass(m.path)}"><a href="#${m.path}">${m.label}</a></li>
            `).join('')}
            </ul>
        </div>
        <div class="content">
        </div>
      </div>
    `;

    const route = this.getCurrentRoute();
    const content = document.querySelector('.root .content');

    if (route) {
      const instance = new route.component();
      content.appendChild(instance);
    } else {
      const notFound = document.createElement('div');
      const title = document.createElement('h1');
      const para = document.createElement('p');
      title.textContent = '404';
      para.textContent = `Cannot find page at: ${this.getSafeHash()} :(`;
      notFound.appendChild(title);
      notFound.appendChild(para);
      content.appendChild(notFound);
    }
  }

  getSafeHash() {
    let { hash } = location;
    if (hash.length > 0) {
      if (hash.startsWith('#')) {
        hash = hash.substring(1);
        if (!hash.startsWith('/')) {
          return '/' + hash;
        }
      }
      return hash;
    }
    return '/';
  }

  getCurrentRoute() {
    return this.routes.find(r => r.path === this.getSafeHash());
  }

  menuActiveClass(path) {
    const hash = this.getSafeHash();
    if (hash === path) {
      return 'menu-active';
    }
    return '';
  }
}

customElements.define('app-wire', AppWire);
