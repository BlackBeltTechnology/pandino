# Filters

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

LDAP-like filter utilities for parsing, serialization and evaluation.

> Please check resources under the `src` folder for detailed descriptions.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Intro

This library only supports a simplified version of the LDAP Query syntax, and is not intended to cover the whole spec.

**Key differences:**

- The `evaluateFilter()` API is case sensitive
- A simplified [semver](https://semver.org/) matcher has been baked in

## API

### evaluateFilter()

Evaluates the data provided against the filter and returns `true` if it matches.

```typescript
import { evaluateFilter } from '@pandino/filters';

const filter = '(&(gn=Jenny)(sn=Jensen*))';

expect(evaluateFilter({ gn: 'Jenny', sn: 'Jensen-Smith' }, filter)).toEqual(true);
```

### parseFilter()

Parses the given filter string and returns the data model of `FilterNode` or `undefined`.

```typescript
import { parseFilter } from '@pandino/filters';

const filter = '(&(gn=Jenny)(sn=Jensen))';

expect(parseFilter(filter)).toEqual({
  operator: 'and',
  children: [
    { attribute: 'gn', operator: 'eq', value: 'Jenny' },
    { attribute: 'sn', operator: 'eq', value: 'Jensen' },
  ],
});
```

### serializeFilter()

Serializes the provided `FilterNode` instance.

```typescript
import { serializeFilter, FilterNode } from '@pandino/filters';

const node: FilterNode = {
    operator: 'and',
    children: [
        { attribute: 'gn', operator: 'eq', value: 'Jenny' },
        { attribute: 'sn', operator: 'eq', value: 'Jensen' },
    ],
};

expect(serializeFilter(node)).toEqual('(&(gn=Jenny)(sn=Jensen))');
```

## Tests

For further examples, please check [the tests](./src/filters.test.ts).

## License

Eclipse Public License - v 2.0
