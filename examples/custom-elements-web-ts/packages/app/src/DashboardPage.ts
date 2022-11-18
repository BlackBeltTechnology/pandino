import type { MenuInfo, Page } from '@custom-elements-web-ts/contract';

export class DashboardService implements Page {
  getMenuInfo(): MenuInfo | undefined {
    return {
      label: 'Dashboard',
      path: '/',
    };
  }

  getPageComponent(): any {
    return DashboardPage;
  }

  getRoutePath(): string {
    return '/';
  }
}

export class DashboardPage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `<h1>Dashboard</h1><p>Content from the Dashboard, yayy!</p>`;
  }
}

customElements.define('app-page-dashboard', DashboardPage);
