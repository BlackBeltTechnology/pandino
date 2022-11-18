import type { MenuInfo, Page } from '@custom-elements-web-ts/contract';

export class AboutPageService implements Page {
  getMenuInfo(): MenuInfo | undefined {
    return {
      label: 'About',
      path: '/about',
    };
  }

  getPageComponent(): any {
    return AboutPage;
  }

  getRoutePath(): string {
    return '/about';
  }
}

export class AboutPage extends HTMLElement {
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

customElements.define('app-page-about', AboutPage);
