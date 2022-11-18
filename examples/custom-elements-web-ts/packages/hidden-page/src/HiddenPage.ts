import type { MenuInfo, Page } from '@custom-elements-web-ts/contract';

export class HiddenPageService implements Page {
  getMenuInfo(): MenuInfo | undefined {
    return undefined;
  }

  getPageComponent(): any {
    return HiddenPage;
  }

  getRoutePath(): string | undefined {
    return undefined;
  }
}

export class HiddenPage extends HTMLElement {
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

customElements.define('app-page-hidden', HiddenPage);
