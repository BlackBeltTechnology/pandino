import { ServiceReference } from './service';

export interface FilterApi {
  match(what: ServiceReference<any> | Record<string, any>): boolean;
  toString(): string;
}
