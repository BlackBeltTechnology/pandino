import {Page} from "../app-meta";

export interface PageComponentProps extends Record<any, any> {
  meta: Page;
  label: string;
}
