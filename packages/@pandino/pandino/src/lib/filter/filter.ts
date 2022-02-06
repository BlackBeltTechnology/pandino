import { FilterApi } from '@pandino/pandino-api';
import peg$parse from './parse';
import { inverseMap, replaceMap } from './workarounds';

export enum FilterComp {
  NOT = '!',
  AND = '&',
  OR = '|',
  EQ = '=',
  LTE = '<=',
  GTE = '>=',
  APPROX = '~=',
  MATCH_ALL = '*',
  PRESENT = '=*',
}

export default class Filter implements FilterApi {
  public readonly type: any = 'filter';

  constructor(public attrib: string, public comp: FilterComp, public value: any, public filters: Filter[] = []) {}

  static attribute(name: any): Attribute {
    return new Attribute(name);
  }

  static parse(input: string): Filter {
    if (input === '(*)') {
      return new Filter(undefined, FilterComp.MATCH_ALL, undefined);
    }

    let newInput = input;
    for (const [original, replaceVal] of replaceMap.entries()) {
      newInput = newInput.replaceAll(original, replaceVal);
    }

    const originalFilter = peg$parse(newInput);
    return Filter.recursiveReplace(originalFilter, inverseMap);
  }

  private static recursiveReplace(filter: Filter, inverseMap: Map<string, string>): Filter {
    for (const [original, replaceVal] of inverseMap.entries()) {
      if (filter.attrib) {
        filter.attrib = filter.attrib.replaceAll(original, replaceVal);
      }
    }

    for (const f of filter.filters) {
      Filter.recursiveReplace(f, inverseMap);
    }

    return filter;
  }

  static convert(attrs: Record<string, any>): Filter {
    // TODO: clarify if this works at all, or not...
    const filters: Filter[] = [];

    for (let [_, value] of Object.entries(attrs)) {
      filters.push(Filter.parse(value.toString()));
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
  }

  match(data: any): boolean {
    const value = this.value;
    const attrv = data[this.attrib];

    switch (this.comp) {
      case '!':
        return Filter.NOT(this.filters)._match(data);
      case '&':
        return Filter.AND(this.filters)._match(data);
      case '|':
        return Filter.OR(this.filters)._match(data);
      case '=':
        if (value === '*' && attrv) {
          return true;
        }
        return Filter.matchString(attrv, value);
      case '<=':
        return Filter.matchLTE(attrv, value);
      case '>=':
        return Filter.matchGTE(attrv, value);
      default:
        throw new Error('Unsupported comparison type');
    }
  }

  simplify(): Filter {
    if (this.filters) {
      if (this.filters.length == 1) {
        return this.filters[0].simplify();
      } else {
        this.filters = this.filters.map((filter) => filter.simplify());
      }
    }
    return this;
  }

  protected _indent(indent?: any, level?: number, id_char?: string | number): string {
    const _i = parseInt(indent);
    if (indent === true) {
      indent = Filter.indent;
    } else if (!isNaN(_i)) {
      indent = _i;
    } else {
      return '';
    }

    if (id_char !== undefined && typeof id_char != 'string') {
      throw new Error('Indent string must be string');
    }

    level = level || 0;
    id_char = id_char || Filter.indent_char;
    if (typeof id_char === 'number') {
      id_char = id_char.toString();
    }

    return id_char.repeat(level * indent);
  }

  toString(indent?: any, level?: number, id_char?: string | number): string {
    return [this._indent(indent, level, id_char), '(', this.attrib, this.comp, this.value, ')'].join('');
  }

  static escapeChars = ['*', '(', ')', '\\', String.fromCharCode(0)];
  static indent = 4;
  static indent_char = ' ';
  static collapse_not = true;

  static escape(value: string): string {
    if (!value) return '';

    return value
      .split('')
      .map((c) => {
        return Filter.escapeChars.indexOf(c) >= 0 ? '\\' + c.charCodeAt(0).toString(16) : c;
      })
      .join('');
  }

  static unescape(data: any): string {
    const chars = data.split('');
    const out = [];
    let tmp;

    while (chars.length) {
      tmp = chars.shift();

      if (tmp == '\\') {
        tmp = chars.shift() + chars.shift();
        tmp = parseInt(tmp, 16);
        tmp = String.fromCharCode(tmp);
      }
      out.push(tmp);
    }

    return out.join('');
  }

  static matchString(data: any, filter: string): boolean {
    if (!data) return false;
    const match = Array.isArray(data) ? data : [data];
    if (filter.indexOf('*') < 0) {
      return match.some((cv) => {
        if (cv) {
          return cv.toLowerCase() === Filter.unescape(filter).toLowerCase();
        }
      });
    }
    return Filter.matchSubstring(data, filter);
  }

  static matchSubstring(data: any, filter: string): boolean {
    const match = Array.isArray(data) ? data : [data];
    let pattern = filter.replace(/\*/g, '.*');
    pattern = pattern.replace(/\\([0-9a-fA-F]{2,2})/g, (m: any, $1: any) => {
      let s = String.fromCharCode(parseInt($1, 16));
      if (['(', ')', '\\', '*'].indexOf(s) >= 0) {
        s = '\\x' + $1.toUpperCase();
      }
      return s;
    });
    const regex = new RegExp('^' + pattern + '$', 'i');
    return match.some((cv) => cv.match(regex));
  }

  static matchLTE(data: any, filter: number): boolean {
    const match = Array.isArray(data) ? data : [data];
    return match.some((cv) => cv <= filter);
  }

  static matchGTE(data: any, filter: number): boolean {
    const match = Array.isArray(data) ? data : [data];
    return match.some((cv) => cv >= filter);
  }

  static AND(filters: Filter[]): GroupAnd {
    return new GroupAnd(filters);
  }

  static OR(filters: Filter[]): GroupOr {
    return new GroupOr(filters);
  }

  static NOT(filter: Filter | Filter[]): GroupNot {
    if (!Array.isArray(filter)) {
      filter = [filter];
    }
    if (filter.length != 1) {
      throw new Error('NOT must wrap single filter');
    }
    return new GroupNot(filter);
  }
}

class Group extends Filter {
  public readonly type: any = 'group';

  constructor(comp: FilterComp, filters: Filter[] = []) {
    super(null, comp, null, filters);
  }

  match(data: any): boolean {
    return super.match(data);
  }

  toString(indent?: any, level?: number, id_char?: string): string {
    level = level || 0;
    let id_str = this._indent(indent, level, id_char);
    let id_str2 = id_str;
    let nl = indent ? '\n' : '';

    if (Filter.collapse_not && this.comp === '!') {
      nl = '';
      id_str2 = '';
      indent = 0;
    }

    return [
      id_str,
      '(',
      this.comp,
      nl,
      this.filters.map((item) => item.toString(indent, level + 1, id_char)).join(nl),
      nl,
      id_str2,
      ')',
    ].join('');
  }
}

class GroupOr extends Group {
  constructor(filters: Filter[] = []) {
    super(FilterComp.OR, filters);
  }

  _match(data: any): boolean {
    return this.filters.some((cv) => cv.match(data));
  }
}

class GroupAnd extends Group {
  constructor(filters: Filter[] = []) {
    super(FilterComp.AND, filters);
  }

  _match(data: any): boolean {
    return this.filters.every((cv) => cv.match(data));
  }
}

class GroupNot extends Group {
  constructor(filters: Filter[] = []) {
    super(FilterComp.NOT, filters);
  }

  _match(data: any): boolean {
    return this.filters.every((cv) => {
      if (cv && typeof cv.match === 'function') {
        return !!!cv.match(data);
      }
    });
  }

  simplify(): GroupNot {
    return this;
  }
}

class Attribute {
  private escapeChars: string[] = ['*', '(', ')', '\\', String.fromCharCode(0)];

  constructor(private name: string) {}

  present(): Filter {
    return new Filter(this.name, FilterComp.EQ, '*');
  }

  raw(value: any): Filter {
    return new Filter(this.name, FilterComp.EQ, value);
  }

  equalTo(value: any): Filter {
    return new Filter(this.name, FilterComp.EQ, this.escape(value));
  }

  endsWith(value: any): Filter {
    return new Filter(this.name, FilterComp.EQ, '*' + this.escape(value));
  }

  startsWith(value: any): Filter {
    return new Filter(this.name, FilterComp.EQ, this.escape(value) + '*');
  }

  contains(value: any): Filter {
    return new Filter(this.name, FilterComp.EQ, '*' + this.escape(value) + '*');
  }

  approx(value: any): Filter {
    return new Filter(this.name, FilterComp.APPROX, this.escape(value));
  }

  lte(value: any): Filter {
    return new Filter(this.name, FilterComp.LTE, this.escape(value));
  }

  gte(value: any): Filter {
    return new Filter(this.name, FilterComp.GTE, this.escape(value));
  }

  escape(value: any): string {
    if (typeof value === 'number') {
      value = value.toString();
    }
    const rv = [];
    for (let i = 0, l = value.length; i < l; i++) {
      rv.push(this.escapeChars.indexOf(value[i]) >= 0 ? '\\' + value.charCodeAt(i).toString(16) : value[i]);
    }
    return rv.join('');
  }
}
