import { FilterApi, FilterParser } from '@pandino/pandino-api';
import { parse } from './parser';

export class FilterParserImpl implements FilterParser {
  parse(filter: string): FilterApi {
    return parse(filter);
  }
}
