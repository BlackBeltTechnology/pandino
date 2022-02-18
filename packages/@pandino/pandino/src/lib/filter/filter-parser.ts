import { FilterApi, FilterParser } from '@pandino/pandino-api';

import Filter from './filter';

export class FilterParserImpl implements FilterParser {
  parse(filter: string): FilterApi {
    return Filter.parse(filter);
  }
}
