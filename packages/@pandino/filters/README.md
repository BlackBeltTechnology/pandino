# Filters

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Conventional Changelog](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-conventional--changelog-e10079.svg?style=flat)](https://github.com/conventional-changelog/conventional-changelog)

LDAP-like filter utilities for parsing, serialization and evaluation.

> Please check resources under the `src` folder for detailed descriptions.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## API

### evaluateFilter()

Evaluates the data provided against the filter and returns `true` if it matches.

```typescript
const filter = '(&(gn=Jenny)(sn=Jensen*))';
expect(evaluateFilter({ gn: 'Jenny', sn: 'Jensen-Smith' }, filter)).toEqual(true);
```

### parseFilter()

Parses the given filter string and returns the data model of `FilterNode` or `undefined`.

```typescript
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
