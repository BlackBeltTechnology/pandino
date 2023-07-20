import { FilterNode, FilterOperator } from '@pandino/pandino-api';

export const convert = (attrs: Record<string, any>): FilterNode => {
  const filters: FilterNode[] = [];

  for (let [_, value] of Object.entries(attrs)) {
    filters.push(parseFilter(value.toString()));
  }

  let filter: FilterNode;

  if (filters.length === 1) {
    filter = filters[0];
  } else if (Object.keys(attrs).length > 1) {
    filter = { attribute: null, operator: 'and', children: filters };
  } else if (filters.length === 0) {
    filter = { attribute: null, operator: 'eq', value: '*' };
  }

  return filter;
};

export function evaluateFilter(data: any, query: string): boolean {
  const node = parseFilter(query);
  return evaluateExpression(node, data);
}

export function evaluateExpression(node: FilterNode, data: any): boolean {
  if (!node.operator) {
    return evaluateExpression(node.children[0], data);
  }

  switch (node.operator) {
    case 'and':
      return node.children.every(function (child) {
        return evaluateExpression(child, data);
      });
    case 'or':
      return node.children.some(function (child) {
        return evaluateExpression(child, data);
      });
    case 'not':
      return !evaluateExpression(node.children[0], data);
    default:
      return evaluateComparison(node, data);
  }
}

export function parseFilter(filter: string): FilterNode {
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

  return current;
}

function evaluateComparison(comparison: FilterNode, data: any): boolean {
  let attribute = comparison.attribute;
  let operator = comparison.operator;
  let value = comparison.value;

  // Traverse the nested attributes to get the actual value
  const attributePath = attribute.split('.');
  let current = data;
  while (attributePath.length > 0 && current) {
    current = current[attributePath.shift()];
  }

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
      return evaluateSemver(current, operator, value);
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

function isSemVer(version: string): boolean {
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

function evaluateSemver(version: string, operator: string, targetVersion: string) {
  // Split the version strings into major, minor, and patch components
  const [vMajor, vMinor, vPatch] = version.split('.').map(Number);
  const [tMajor, tMinor, tPatch] = targetVersion.split('.').map(Number);

  // Evaluate the comparison based on the specified operator
  switch (operator) {
    case 'lte':
      return vMajor < tMajor
        ? true
        : vMajor > tMajor
        ? false
        : vMinor < tMinor
        ? true
        : vMinor > tMinor
        ? false
        : vPatch <= tPatch;
    case 'lt':
      return vMajor < tMajor
        ? true
        : vMajor > tMajor
        ? false
        : vMinor < tMinor
        ? true
        : vMinor > tMinor
        ? false
        : vPatch < tPatch;
    case 'gte':
      return vMajor > tMajor
        ? true
        : vMajor < tMajor
        ? false
        : vMinor > tMinor
        ? true
        : vMinor < tMinor
        ? false
        : vPatch >= tPatch;
    case 'gt':
      return vMajor > tMajor
        ? true
        : vMajor < tMajor
        ? false
        : vMinor > tMinor
        ? true
        : vMinor < tMinor
        ? false
        : vPatch > tPatch;
    case 'eq':
      return vMajor === tMajor && vMinor === tMinor && vPatch === tPatch;
    case 'neq':
      return vMajor !== tMajor || vMinor !== tMinor || vPatch !== tPatch;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
}
