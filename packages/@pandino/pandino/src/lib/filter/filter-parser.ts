import { FilterParser } from '@pandino/pandino-api';

import Filter from './filter';

export const filterParser: FilterParser = (filter: string) => Filter.parse(filter);
