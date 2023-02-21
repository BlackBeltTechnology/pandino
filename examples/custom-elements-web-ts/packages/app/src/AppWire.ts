import type { BundleContext, ServiceReference, ServiceEvent } from '@pandino/pandino-api';
import { SERVICE_ID } from '@pandino/pandino-api';
import type { Menu, Route } from './contracts';
import type { MenuInfo, Page } from '@custom-elements-web-ts/contract';
import { PAGE_INTERFACE_KEY } from '@custom-elements-web-ts/contract';

export class AppWire extends HTMLElement {
  private routes: Route[] = [];
  private menus: Menu[] = [];
  private context: BundleContext;

  constructor(context: BundleContext) {
    super();

    this.context = context;

    const refs = context.getServiceReferences<ServiceReference<Page>>(PAGE_INTERFACE_KEY);
    refs.forEach(this.processService.bind(this));

    this.context.addServiceListener(
      {
        serviceChanged: (event: ServiceEvent) => {
          if (event.getType() === 'REGISTERED') {
            const ref = event.getServiceReference();
            // const svc = context.getService<Page>(ref);
            // const serviceId = ref.getProperty(SERVICE_ID);
            // if (typeof svc.getMenuInfo === 'function') {
            //   this.addMenu(serviceId, svc.getMenuInfo());
            // }
            // this.addRoute(serviceId, svc.getRoutePath(), svc.getPageComponent());
            this.processService(ref);
            this.paint();
          }
        },
      },
      `(objectClass=${PAGE_INTERFACE_KEY})`,
    );

    window.addEventListener('load', this.route.bind(this));
    window.addEventListener('hashchange', this.route.bind(this));
  }

  processService(ref: ServiceReference<Page>) {
    const svc = this.context.getService<Page>(ref);
    const serviceId = ref.getProperty(SERVICE_ID);
    if (typeof svc.getMenuInfo === 'function') {
      const menuInfo = svc.getMenuInfo();

      if (menuInfo) {
        this.addMenu(serviceId, menuInfo);
      }
    }
    this.addRoute(serviceId, svc.getRoutePath(), svc.getPageComponent());
  }

  route(event: any) {
    this.paint();
  }

  addMenu(serviceId: string, menuProps: MenuInfo) {
    this.menus.push({
      ...menuProps,
      serviceId,
    });
    this.menus.sort((a, b) => a.label.localeCompare(b.label));
  }

  addRoute(serviceId: string, path: string, component: any) {
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
            ${this.menus
              .map(
                (m) => `
                <li class="${this.menuActiveClass(m.path)}"><a href="#${m.path}">${m.label}</a></li>
            `,
              )
              .join('')}
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

  getSafeHash(): string {
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

  getCurrentRoute(): Route {
    return this.routes.find((r) => r.path === this.getSafeHash());
  }

  menuActiveClass(path: string): string {
    const hash = this.getSafeHash();
    if (hash === path) {
      return 'menu-active';
    }
    return '';
  }
}

customElements.define('app-wire', AppWire);
