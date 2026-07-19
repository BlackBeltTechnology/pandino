import type { Filter } from './interfaces';

export class LDAPFilter implements Filter {
  private readonly filterString: string;
  private readonly ast: FilterAST;

  constructor(filterString: string) {
    this.filterString = filterString;
    this.ast = this.buildAST(filterString);
  }

  match(properties: Record<string, any>): boolean {
    return this.evaluateAST(this.ast, properties);
  }

  toString(): string {
    return this.filterString;
  }

  getAST(): FilterAST {
    return this.ast;
  }

  protected buildAST(filter: string): FilterAST {
    if (!filter.startsWith('(') || !filter.endsWith(')')) {
      throw new Error('Filter must be enclosed in parentheses');
    }

    filter = filter.slice(1, -1);

    if (filter.startsWith('&')) {
      return this.parseLogicalFilter(filter.slice(1), 'and');
    }
    if (filter.startsWith('|')) {
      return this.parseLogicalFilter(filter.slice(1), 'or');
    }
    if (filter.startsWith('!')) {
      const remaining = filter.slice(1);
      if (!remaining.startsWith('(')) {
        throw new Error('Invalid NOT filter syntax');
      }
      return { type: 'not', children: [this.buildAST(remaining)] };
    }

    if (filter.includes('>=')) {
      const [key, value] = filter.split('>=', 2);
      return { type: 'gte', key: key.trim(), value: value.trim() };
    }
    if (filter.includes('<=')) {
      const [key, value] = filter.split('<=', 2);
      return { type: 'lte', key: key.trim(), value: value.trim() };
    }
    if (filter.includes('~=')) {
      const [key, value] = filter.split('~=', 2);
      return { type: 'approx', key: key.trim(), value: value.trim() };
    }
    if (filter.includes('=')) {
      const [key, value] = filter.split('=', 2);
      return { type: 'equals', key: key.trim(), value: value.trim() };
    }

    throw new Error('Invalid filter syntax');
  }

  private parseLogicalFilter(filter: string, type: 'and' | 'or'): FilterAST {
    const children: FilterAST[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < filter.length; i++) {
      if (filter[i] === '(') {
        depth++;
      } else if (filter[i] === ')') {
        depth--;
        if (depth === 0) {
          children.push(this.buildAST(filter.slice(start, i + 1)));
          start = i + 1;
        }
      }
    }

    return { type, children };
  }

  protected evaluateAST(ast: FilterAST, properties: Record<string, any>): boolean {
    switch (ast.type) {
      case 'equals':
        return this.leafMatch(properties[ast.key!], (v) => this.matchEquals(v, ast.value!));
      case 'gte':
        return this.leafMatch(properties[ast.key!], (v) => this.compareValues(v, ast.value!) >= 0);
      case 'lte':
        return this.leafMatch(properties[ast.key!], (v) => this.compareValues(v, ast.value!) <= 0);
      case 'approx':
        return this.leafMatch(properties[ast.key!], (v) => this.matchApprox(v, ast.value!));
      case 'and':
        return ast.children!.every((child) => this.evaluateAST(child, properties));
      case 'or':
        return ast.children!.some((child) => this.evaluateAST(child, properties));
      case 'not':
        return !this.evaluateAST(ast.children![0], properties);
      case 'true':
        return true;
      default:
        return false;
    }
  }

  /**
   * A multi-valued (array) property matches if ANY member satisfies the test,
   * per OSGi filter semantics for collections/arrays.
   */
  private leafMatch(actual: any, test: (value: any) => boolean): boolean {
    if (Array.isArray(actual)) {
      return actual.some((element) => test(element));
    }
    return test(actual);
  }

  protected matchEquals(actual: any, expected: string): boolean {
    if (expected === '*') {
      return actual !== undefined && actual !== null;
    }

    if (this.hasUnescapedWildcard(expected)) {
      return this.matchWildcard(String(actual ?? ''), expected);
    }
    // No wildcard: unescape and compare literally (an escaped `\*` stays literal).
    return String(actual) === expected.replace(/\\(.)/g, '$1');
  }

  private hasUnescapedWildcard(pattern: string): boolean {
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '\\') {
        i++; // skip the escaped char
        continue;
      }
      if (pattern[i] === '*') {
        return true;
      }
    }
    return false;
  }

  /**
   * Approximate match (`~=`). OSGi leaves the exact algorithm implementation
   * defined; this port compares values case-insensitively after stripping all
   * whitespace.
   */
  protected matchApprox(actual: any, expected: string): boolean {
    if (actual === undefined || actual === null) {
      return false;
    }
    const normalize = (value: string): string => value.replace(/\s+/g, '').toLowerCase();
    return normalize(String(actual)) === normalize(expected);
  }

  protected matchWildcard(actual: string, pattern: string): boolean {
    // Split on UNescaped `*` (wildcards); `\x` is a literal x within a segment,
    // so an escaped `\*` matches a literal asterisk rather than acting as a glob.
    const segments: string[] = [];
    let current = '';
    for (let i = 0; i < pattern.length; i++) {
      const ch = pattern[i];
      if (ch === '\\' && i + 1 < pattern.length) {
        current += pattern[i + 1];
        i++;
      } else if (ch === '*') {
        segments.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    segments.push(current);

    const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = segments.map(escapeRegExp).join('.*');
    return new RegExp(`^${regex}$`).test(actual);
  }

  protected compareValues(actual: any, expected: string): number {
    if (typeof actual === 'number') {
      const expectedNum = Number(expected);
      if (!Number.isNaN(expectedNum)) {
        return actual - expectedNum;
      }
    }

    const actualNum = Number(actual);
    const expectedNum = Number(expected);

    if (!Number.isNaN(actualNum) && !Number.isNaN(expectedNum)) {
      return actualNum - expectedNum;
    }

    const actualStr = String(actual || '');
    return actualStr.localeCompare(expected);
  }
}

export interface FilterAST {
  type: 'equals' | 'gte' | 'lte' | 'approx' | 'and' | 'or' | 'not' | 'true';
  key?: string;
  value?: string;
  children?: FilterAST[];
}
