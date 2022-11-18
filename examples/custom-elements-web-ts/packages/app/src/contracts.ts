import { MenuInfo } from '@custom-elements-web-ts/contract';

export interface Route {
  path: string;
  component: any;
  serviceId: string;
}

export interface Menu extends MenuInfo {
  serviceId: string;
}
