import { FilterApi } from './filter-api';

export interface FilterParser {
  parse(filter: string): FilterApi;
}
