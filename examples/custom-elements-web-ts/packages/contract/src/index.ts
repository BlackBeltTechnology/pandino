export const PAGE_INTERFACE_KEY = '@custom-elements-web-ts/contract/Page';

export interface Page {
  getMenuInfo(): MenuInfo | undefined;
  getPageComponent(): typeof HTMLElement | any;
  getRoutePath(): string;
}

export interface MenuInfo {
  label: string;
  path: string;
}
