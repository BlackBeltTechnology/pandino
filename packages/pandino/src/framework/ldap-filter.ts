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
        return this.matchEquals(properties[ast.key!], ast.value!);
      case 'gte':
        return this.compareValues(properties[ast.key!], ast.value!) >= 0;
      case 'lte':
        return this.compareValues(properties[ast.key!], ast.value!) <= 0;
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

  protected matchEquals(actual: any, expected: string): boolean {
    if (expected === '*') {
      return actual !== undefined && actual !== null;
    }

    const unescapedExpected = expected.replace(/\\(.)/g, '$1');

    if (unescapedExpected.includes('*')) {
      return this.matchWildcard(String(actual || ''), unescapedExpected);
    }
    return String(actual) === unescapedExpected;
  }

  protected matchWildcard(actual: string, pattern: string): boolean {
    const regex = pattern.replace(/\*/g, '.*');
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
  type: 'equals' | 'gte' | 'lte' | 'and' | 'or' | 'not' | 'true';
  key?: string;
  value?: string;
  children?: FilterAST[];
}
