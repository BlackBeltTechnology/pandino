import { inverseMap, replaceMap } from './workarounds';
import peg$parse from './parse';
import Filter, { FilterComp } from './filter';

export const parse = (input: string): Filter => {
  if (input === '(*)') {
    return new Filter(undefined, FilterComp.MATCH_ALL, undefined);
  }

  let newInput = input;
  for (const [original, replaceVal] of replaceMap.entries()) {
    newInput = newInput.replace(new RegExp(original, 'g'), replaceVal);
  }

  const originalFilter = peg$parse(newInput);
  return recursiveReplace(originalFilter, inverseMap);
};

export const convert = (attrs: Record<string, any>): Filter => {
  const filters: Filter[] = [];

  for (let [_, value] of Object.entries(attrs)) {
    filters.push(parse(value.toString()));
  }

  let filter: Filter;

  if (filters.length === 1) {
    filter = filters[0];
  } else if (Object.keys(attrs).length > 1) {
    filter = new Filter(null, FilterComp.AND, filters);
  } else if (filters.length === 0) {
    filter = new Filter(null, FilterComp.MATCH_ALL, null);
  }

  return filter;
};

const recursiveReplace = (filter: Filter, inverseMap: Map<string, string>): Filter => {
  for (const [original, replaceVal] of inverseMap.entries()) {
    if (filter.attrib) {
      filter.attrib = filter.attrib.replace(new RegExp(original, 'g'), replaceVal);
    }
  }

  for (const f of filter.filters) {
    recursiveReplace(f, inverseMap);
  }

  return filter;
};
