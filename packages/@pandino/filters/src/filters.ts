import type { FilterEvaluator, FilterNode, FilterOperator, SemVerOperator } from './types';
import { FilterOperatorSymbolMapping } from './types';

export const convert = (attrs: Record<string, any>): FilterNode => {
  const filters: FilterNode[] = [];

  for (let [_, value] of Object.entries(attrs)) {
    filters.push(parseFilter(value.toString()));
  }

  let filter: FilterNode;

  if (filters.length === 1) {
    filter = filters[0];
  } else if (Object.keys(attrs).length > 1) {
    filter = { attribute: undefined, operator: 'and', children: filters };
  } else if (filters.length === 0) {
    filter = { attribute: undefined, operator: 'eq', value: '*' };
  }

  return filter!;
};

export const evaluateFilter: FilterEvaluator = (data: any, query: string): boolean => {
  const node = parseFilter(query);
  return evaluateFilterNode(node, data);
};

export function evaluateFilterNode(node: FilterNode, data: any): boolean {
  if (!node.operator && node.children) {
    return evaluateFilterNode(node.children[0], data);
  }

  switch (node.operator) {
    case 'and':
      return (
        node.children?.every(function (child) {
          return evaluateFilterNode(child, data);
        }) ?? false
      );
    case 'or':
      return (
        node.children?.some(function (child) {
          return evaluateFilterNode(child, data);
        }) ?? false
      );
    case 'not':
      return node.children ? !evaluateFilterNode(node.children[0], data) : false;
    default:
      return evaluateComparison(node, data);
  }
}

export function serializeFilter(node: FilterNode): string | undefined {
  if (node.operator && node.attribute && node.value !== undefined) {
    return `(${node.attribute}${FilterOperatorSymbolMapping[node.operator]}${node.value})`;
  }

  if (node.operator && node.children && node.children.length > 0) {
    const childFilters = node.children.map(serializeFilter).join('');
    return `(${FilterOperatorSymbolMapping[node.operator]}${childFilters})`;
  }

  if (node.expression) {
    return `(${node.expression})`;
  }

  return undefined;
}

export function parseFilter(filter: string): FilterNode | never {
  const filtered = filter.replace(/\s/g, '');
  const stack = [];
  let current: FilterNode = {};

  for (let i = 0; i < filtered.length; i++) {
    const char = filtered.charAt(i);

    if (char === '(') {
      const node: FilterNode = {};
      current.children = current.children || [];
      current.children.push(node);
      stack.push(current);
      current = node;
    } else if (char === ')') {
      if (!stack.length) {
        throw new Error('Unmatched closing parenthesis');
      }
      // @ts-ignore
      current = stack.pop();
    } else if (char === '|') {
      current.operator = 'or';
    } else if (char === '&') {
      current.operator = 'and';
    } else if (char === '!') {
      current.operator = 'not';
    } else {
      if (!current.expression) {
        current.expression = '';
      }
      current.expression += char;
    }
  }

  splitNodeExpression(current);

  if (
    current &&
    current.operator === undefined &&
    current.value === undefined &&
    current.expression === undefined &&
    current.children &&
    current.children.length === 1
  ) {
    return current.children[0];
  }

  return current;
}

function evaluateComparison(comparison: FilterNode, data: any): boolean {
  let attribute = comparison.attribute;
  let operator = comparison.operator;
  let value = comparison.value;

  // Traverse the nested attributes to get the actual value
  // const attributePath = attribute ? attribute.split('.') : [];
  let current = attribute ? data[attribute] : undefined;
  // while (attributePath.length > 0 && current) {
  //   current = current[attributePath.shift()!];
  // }

  // Handle missing attributes gracefully
  if (current === undefined) {
    return false;
  }

  let typedValue = value;
  if (current !== null) {
    if (typeof current === 'number') {
      typedValue = Number(value);
    } else if (typeof current === 'boolean') {
      typedValue = value === 'true';
    } else if (isSemVer(current)) {
      return evaluateSemver(current, operator as SemVerOperator, value);
    }
  }

  const arrayIncludes = operator === 'eq' && Array.isArray(current);
  const present = typedValue === '*';
  const leadStar = typeof typedValue === 'string' && typedValue.startsWith('*');
  const trailStar = typeof typedValue === 'string' && typedValue.endsWith('*');
  const startsWith = !leadStar && trailStar;
  const endsWith = leadStar && !trailStar;
  const contains = leadStar && trailStar;

  switch (operator) {
    case 'eq':
      if (arrayIncludes) {
        return (current as Array<any>).includes(typedValue);
      } else if (present) {
        return current !== null && current !== undefined;
      } else if (contains) {
        const mut = typedValue.substring(1, typedValue.length - 2);
        return current.includes(mut);
      } else if (startsWith) {
        const mut = typedValue.substring(0, typedValue.length - 2);
        return current.startsWith(mut);
      } else if (endsWith) {
        const mut = typedValue.substring(1);
        return current.endsWith(mut);
      }
      return current === typedValue;
    case 'gt':
      return current > typedValue;
    case 'gte':
      return current >= typedValue;
    case 'lt':
      return current < typedValue;
    case 'lte':
      return current <= typedValue;
    default:
      return false;
  }
}

function splitNodeExpression(node: FilterNode): void {
  const kv: Record<string, FilterOperator> = {
    '<=': 'lte',
    '>=': 'gte',
    '=': 'eq',
    '<': 'lt',
    '>': 'gt',
  };

  if (node.expression) {
    let trimmed = node.expression.trim();
    for (const key in kv) {
      if (trimmed.includes(key)) {
        const split = trimmed.split(key);

        node.operator = kv[key];
        node.attribute = split[0].trim();
        node.value = split[1].trim();

        delete node.expression;
        break;
      }
    }
  }

  if (Array.isArray(node.children)) {
    node.children.forEach(splitNodeExpression);
  }
}

export function isSemVer(version: string): boolean {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

export function evaluateSemver(version: string, operator: SemVerOperator, targetVersion: string) {
  // Split the version strings into major, minor, and patch components
  const [vMajor, vMinor, vPatch] = version.split('.').map(Number);
  const [tMajor, tMinor, tPatch] = targetVersion.split('.').map(Number);

  // Evaluate the comparison based on the specified operator
  switch (operator) {
    case 'lte':
      return vMajor < tMajor ? true : vMajor > tMajor ? false : vMinor < tMinor ? true : vMinor > tMinor ? false : vPatch <= tPatch;
    case 'lt':
      return vMajor < tMajor ? true : vMajor > tMajor ? false : vMinor < tMinor ? true : vMinor > tMinor ? false : vPatch < tPatch;
    case 'gte':
      return vMajor > tMajor ? true : vMajor < tMajor ? false : vMinor > tMinor ? true : vMinor < tMinor ? false : vPatch >= tPatch;
    case 'gt':
      return vMajor > tMajor ? true : vMajor < tMajor ? false : vMinor > tMinor ? true : vMinor < tMinor ? false : vPatch > tPatch;
    case 'eq':
      return vMajor === tMajor && vMinor === tMinor && vPatch === tPatch;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
}
