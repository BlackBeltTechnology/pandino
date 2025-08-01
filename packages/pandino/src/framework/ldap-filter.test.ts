import { describe, expect, it } from 'vitest';
import { type FilterAST, LDAPFilter } from './ldap-filter';

class TestableLDAPFilter extends LDAPFilter {
  public buildAST(filter: string) {
    return super.buildAST(filter);
  }

  public evaluateAST(ast: any, properties: Record<string, any>) {
    return super.evaluateAST(ast, properties);
  }

  public matchEquals(actual: any, expected: string) {
    return super.matchEquals(actual, expected);
  }

  public matchWildcard(actual: string, pattern: string) {
    return super.matchWildcard(actual, pattern);
  }

  public compareValues(actual: any, expected: string) {
    return super.compareValues(actual, expected);
  }
}

describe('LDAPFilter', () => {
  describe('constructor', () => {
    it('should create filter with valid syntax', () => {
      expect(() => new LDAPFilter('(objectClass=*)')).not.toThrow();
      expect(() => new LDAPFilter('(&(objectClass=Service)(version>=1.0))')).not.toThrow();
    });

    it('should throw error for invalid syntax', () => {
      expect(() => new LDAPFilter('invalid')).toThrow('Filter must be enclosed in parentheses');
      expect(() => new LDAPFilter('(unclosed')).toThrow('Filter must be enclosed in parentheses');
      expect(() => new LDAPFilter('unclosed)')).toThrow('Filter must be enclosed in parentheses');
      expect(() => new LDAPFilter('()')).toThrow('Invalid filter syntax');
      expect(() => new LDAPFilter('(invalid-operator)')).toThrow('Invalid filter syntax');
    });
  });

  describe('AST building and tree structure', () => {
    it('should build simple equality AST correctly', () => {
      const filter = new LDAPFilter('(objectClass=Service)');
      const ast = filter.getAST();

      const expectedAST: FilterAST = {
        type: 'equals',
        key: 'objectClass',
        value: 'Service',
      };

      expect(ast).toEqual(expectedAST);
    });

    it('should build comparison AST correctly', () => {
      const gteFilter = new LDAPFilter('(version>=1.0)');
      const lteFilter = new LDAPFilter('(priority<=5)');

      const expectedGteAST: FilterAST = {
        type: 'gte',
        key: 'version',
        value: '1.0',
      };

      const expectedLteAST: FilterAST = {
        type: 'lte',
        key: 'priority',
        value: '5',
      };

      expect(gteFilter.getAST()).toEqual(expectedGteAST);
      expect(lteFilter.getAST()).toEqual(expectedLteAST);
    });

    it('should build AND AST with correct tree structure', () => {
      const filter = new LDAPFilter('(&(objectClass=Service)(version>=1.0))');
      const ast = filter.getAST();

      const expectedAST: FilterAST = {
        type: 'and',
        children: [
          {
            type: 'equals',
            key: 'objectClass',
            value: 'Service',
          },
          {
            type: 'gte',
            key: 'version',
            value: '1.0',
          },
        ],
      };

      expect(ast).toEqual(expectedAST);
    });

    it('should build OR AST with correct tree structure', () => {
      const filter = new LDAPFilter('(|(objectClass=Service)(objectClass=Component))');
      const ast = filter.getAST();

      const expectedAST: FilterAST = {
        type: 'or',
        children: [
          {
            type: 'equals',
            key: 'objectClass',
            value: 'Service',
          },
          {
            type: 'equals',
            key: 'objectClass',
            value: 'Component',
          },
        ],
      };

      expect(ast).toEqual(expectedAST);
    });

    it('should build NOT AST with correct tree structure', () => {
      const filter = new LDAPFilter('(!(objectClass=Service))');
      const ast = filter.getAST();

      const expectedAST: FilterAST = {
        type: 'not',
        children: [
          {
            type: 'equals',
            key: 'objectClass',
            value: 'Service',
          },
        ],
      };

      expect(ast).toEqual(expectedAST);
    });

    it('should build nested logical AST correctly', () => {
      const filter = new LDAPFilter('(&(|(objectClass=Service)(objectClass=Component))(version>=1.0))');
      const ast = filter.getAST();

      const expectedAST: FilterAST = {
        type: 'and',
        children: [
          {
            type: 'or',
            children: [
              {
                type: 'equals',
                key: 'objectClass',
                value: 'Service',
              },
              {
                type: 'equals',
                key: 'objectClass',
                value: 'Component',
              },
            ],
          },
          {
            type: 'gte',
            key: 'version',
            value: '1.0',
          },
        ],
      };

      expect(ast).toEqual(expectedAST);
    });

    it('should build complex nested AST', () => {
      const filter = new LDAPFilter('(|(&(objectClass=Service)(version>=1.0))(!(status=inactive)))');
      const ast = filter.getAST();

      const expectedAST: FilterAST = {
        type: 'or',
        children: [
          {
            type: 'and',
            children: [
              {
                type: 'equals',
                key: 'objectClass',
                value: 'Service',
              },
              {
                type: 'gte',
                key: 'version',
                value: '1.0',
              },
            ],
          },
          {
            type: 'not',
            children: [
              {
                type: 'equals',
                key: 'status',
                value: 'inactive',
              },
            ],
          },
        ],
      };

      expect(ast).toEqual(expectedAST);
    });
  });

  describe('wildcard matching', () => {
    it('should match various wildcard patterns', () => {
      const filter = new TestableLDAPFilter('(name=*)');

      expect(filter.matchWildcard('anything', '*')).toBe(true);
      expect(filter.matchWildcard('', '*')).toBe(true);
      expect(filter.matchWildcard('test-service', 'test*')).toBe(true);
      expect(filter.matchWildcard('my-test', '*test')).toBe(true);
      expect(filter.matchWildcard('my-test-service', '*test*')).toBe(true);
      expect(filter.matchWildcard('service', 'test*')).toBe(false);
    });

    it('should handle multiple wildcards', () => {
      const filter = new TestableLDAPFilter('(name=*)');

      expect(filter.matchWildcard('a-b-c', '*-*-*')).toBe(true);
      expect(filter.matchWildcard('prefix-middle-suffix', 'prefix*suffix')).toBe(true);
      expect(filter.matchWildcard('nomatch', 'prefix*suffix')).toBe(false);
    });
  });

  describe('value comparison', () => {
    it('should compare string values correctly', () => {
      const filter = new TestableLDAPFilter('(version>=1.0)');

      expect(filter.compareValues('2.0', '1.0')).toBeGreaterThan(0);
      expect(filter.compareValues('1.0', '2.0')).toBeLessThan(0);
      expect(filter.compareValues('1.0', '1.0')).toBe(0);
    });

    it('should handle null/undefined values', () => {
      const filter = new TestableLDAPFilter('(version>=1.0)');

      expect(filter.compareValues(null, '1.0')).toBeLessThan(0);
      expect(filter.compareValues(undefined, '1.0')).toBeLessThan(0);
    });
  });

  describe('edge cases and error conditions', () => {
    it('should handle empty property values', () => {
      const filter = new LDAPFilter('(objectClass=*)');

      expect(filter.match({ objectClass: '' })).toBe(true);
      expect(filter.match({ objectClass: null })).toBe(false);
      expect(filter.match({ objectClass: undefined })).toBe(false);
    });

    it('should handle missing properties', () => {
      const filter = new LDAPFilter('(objectClass=Service)');

      expect(filter.match({})).toBe(false);
      expect(filter.match({ otherProp: 'Service' })).toBe(false);
    });

    it('should handle filters with spaces', () => {
      const filter = new LDAPFilter('( objectClass = Service )');

      expect(filter.match({ objectClass: 'Service' })).toBe(true);
    });

    it('should handle complex nested structures', () => {
      const filter = new LDAPFilter(
        '(&(|(objectClass=Service)(objectClass=Component))(!(status=inactive))(version>=1.0))',
      );

      expect(
        filter.match({
          objectClass: 'Service',
          status: 'active',
          version: '1.5',
        }),
      ).toBe(true);

      expect(
        filter.match({
          objectClass: 'Service',
          status: 'inactive',
          version: '1.5',
        }),
      ).toBe(false);
    });

    it('should handle empty AND/OR filters', () => {
      expect(() => new LDAPFilter('(&)')).not.toThrow();
      expect(() => new LDAPFilter('(|)')).not.toThrow();

      const andFilter = new LDAPFilter('(&)');
      const orFilter = new LDAPFilter('(|)');

      const expectedAndAST: FilterAST = {
        type: 'and',
        children: [],
      };

      const expectedOrAST: FilterAST = {
        type: 'or',
        children: [],
      };

      expect(andFilter.getAST()).toEqual(expectedAndAST);
      expect(orFilter.getAST()).toEqual(expectedOrAST);
    });

    it('should handle filters with special characters in values', () => {
      const filter = new LDAPFilter('(name=test\\*value)');

      const expectedAST: FilterAST = {
        type: 'equals',
        key: 'name',
        value: 'test\\*value',
      };

      expect(filter.getAST()).toEqual(expectedAST);
      expect(filter.match({ name: 'test*value' })).toBe(true);
    });
  });

  describe('match method comprehensive tests', () => {
    it('should match simple equality filters', () => {
      const filter = new LDAPFilter('(objectClass=Service)');

      expect(filter.match({ objectClass: 'Service' })).toBe(true);
      expect(filter.match({ objectClass: 'Component' })).toBe(false);
      expect(filter.match({ otherProp: 'Service' })).toBe(false);
    });

    it('should match wildcard filters', () => {
      const filter = new LDAPFilter('(objectClass=*)');

      expect(filter.match({ objectClass: 'Service' })).toBe(true);
      expect(filter.match({ objectClass: '' })).toBe(true);
      expect(filter.match({ otherProp: 'value' })).toBe(false);
    });

    it('should match substring filters', () => {
      const filter = new LDAPFilter('(name=*test*)');

      expect(filter.match({ name: 'my-test-service' })).toBe(true);
      expect(filter.match({ name: 'test' })).toBe(true);
      expect(filter.match({ name: 'service' })).toBe(false);
    });

    it('should match comparison filters', () => {
      const greaterFilter = new LDAPFilter('(version>=1.5)');
      const lessFilter = new LDAPFilter('(version<=2.0)');

      expect(greaterFilter.match({ version: '2.0' })).toBe(true);
      expect(greaterFilter.match({ version: '1.0' })).toBe(false);
      expect(lessFilter.match({ version: '1.5' })).toBe(true);
      expect(lessFilter.match({ version: '3.0' })).toBe(false);
    });

    it('should match AND filters', () => {
      const filter = new LDAPFilter('(&(objectClass=Service)(version>=1.0))');

      expect(filter.match({ objectClass: 'Service', version: '1.5' })).toBe(true);
      expect(filter.match({ objectClass: 'Service', version: '0.5' })).toBe(false);
      expect(filter.match({ objectClass: 'Component', version: '1.5' })).toBe(false);
    });

    it('should match OR filters', () => {
      const filter = new LDAPFilter('(|(objectClass=Service)(objectClass=Component))');

      expect(filter.match({ objectClass: 'Service' })).toBe(true);
      expect(filter.match({ objectClass: 'Component' })).toBe(true);
      expect(filter.match({ objectClass: 'Other' })).toBe(false);
    });

    it('should match NOT filters', () => {
      const filter = new LDAPFilter('(!(objectClass=Service))');

      expect(filter.match({ objectClass: 'Component' })).toBe(true);
      expect(filter.match({ objectClass: 'Service' })).toBe(false);
      expect(filter.match({ otherProp: 'value' })).toBe(true);
    });

    it('should handle numeric-like string comparisons', () => {
      const filter = new LDAPFilter('(priority>=5)');

      expect(filter.match({ priority: '10' })).toBe(true);
      expect(filter.match({ priority: '5' })).toBe(true);
      expect(filter.match({ priority: '6' })).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return original filter string', () => {
      const filterString = '(&(objectClass=Service)(version>=1.0))';
      const filter = new LDAPFilter(filterString);

      expect(filter.toString()).toBe(filterString);
    });
  });

  describe('documentation examples coverage', () => {
    describe('service configuration filters', () => {
      it('should match database type filters', () => {
        const filter = new LDAPFilter('(db.type=mysql)');

        expect(filter.match({ 'db.type': 'mysql' })).toBe(true);
        expect(filter.match({ 'db.type': 'postgresql' })).toBe(false);
      });

      it('should match service ranking filters', () => {
        const filter = new LDAPFilter('(service.ranking>=100)');

        expect(filter.match({ 'service.ranking': '100' })).toBe(true);
        expect(filter.match({ 'service.ranking': '150' })).toBe(true);
        expect(filter.match({ 'service.ranking': '50' })).toBe(false);
        expect(filter.match({ 'service.ranking': '099' })).toBe(false);
      });

      it('should match complex host and port filters', () => {
        const filter = new LDAPFilter('(&(db.host=localhost)(db.port>=3000))');

        expect(filter.match({ 'db.host': 'localhost', 'db.port': '3306' })).toBe(true);
        expect(filter.match({ 'db.host': 'localhost', 'db.port': '5432' })).toBe(true);
        expect(filter.match({ 'db.host': 'remote', 'db.port': '3306' })).toBe(false);
        expect(filter.match({ 'db.host': 'localhost', 'db.port': '1000' })).toBe(false);
      });
    });

    describe('service tracker filters', () => {
      it('should match production database services', () => {
        const filter = new LDAPFilter('(&(objectClass=DatabaseService)(environment=production))');

        expect(filter.match({ objectClass: 'DatabaseService', environment: 'production' })).toBe(true);
        expect(filter.match({ objectClass: 'DatabaseService', environment: 'development' })).toBe(false);
        expect(filter.match({ objectClass: 'OtherService', environment: 'production' })).toBe(false);
      });

      it('should match cache services with OR condition', () => {
        const filter = new LDAPFilter('(&(objectClass=CacheService)(|(type=redis)(type=memcached)))');

        expect(filter.match({ objectClass: 'CacheService', type: 'redis' })).toBe(true);
        expect(filter.match({ objectClass: 'CacheService', type: 'memcached' })).toBe(true);
        expect(filter.match({ objectClass: 'CacheService', type: 'file' })).toBe(false);
        expect(filter.match({ objectClass: 'DatabaseService', type: 'redis' })).toBe(false);
      });

      it('should match payment provider filters', () => {
        const filter = new LDAPFilter('(&(service.ranking>=100)(provider.type=credit_card))');

        expect(filter.match({ 'service.ranking': '100', 'provider.type': 'credit_card' })).toBe(true);
        expect(filter.match({ 'service.ranking': '150', 'provider.type': 'credit_card' })).toBe(true);
        expect(filter.match({ 'service.ranking': '50', 'provider.type': 'credit_card' })).toBe(false);
        expect(filter.match({ 'service.ranking': '099', 'provider.type': 'credit_card' })).toBe(false);
        expect(filter.match({ 'service.ranking': '100', 'provider.type': 'paypal' })).toBe(false);
      });

      it('should match fraud detection vendor filters', () => {
        const filter = new LDAPFilter('(|(vendor=verified_inc)(vendor=fraud_guard))');

        expect(filter.match({ vendor: 'verified_inc' })).toBe(true);
        expect(filter.match({ vendor: 'fraud_guard' })).toBe(true);
        expect(filter.match({ vendor: 'other_vendor' })).toBe(false);
      });
    });

    describe('event filters', () => {
      it('should match order amount filters', () => {
        const filter = new LDAPFilter('(amount>=100)');

        expect(filter.match({ amount: '100' })).toBe(true);
        expect(filter.match({ amount: '150' })).toBe(true);
        expect(filter.match({ amount: '50' })).toBe(false);
        expect(filter.match({ amount: '099' })).toBe(false);
      });

      it('should match user status filters', () => {
        const filter = new LDAPFilter('(&(status=active)(type=premium))');

        expect(filter.match({ status: 'active', type: 'premium' })).toBe(true);
        expect(filter.match({ status: 'active', type: 'standard' })).toBe(false);
        expect(filter.match({ status: 'inactive', type: 'premium' })).toBe(false);
      });

      it('should match event priority filters', () => {
        const filter = new LDAPFilter('(|(category=urgent)(priority=1))');

        expect(filter.match({ category: 'urgent' })).toBe(true);
        expect(filter.match({ priority: '1' })).toBe(true);
        expect(filter.match({ category: 'normal', priority: '2' })).toBe(false);
      });
    });

    describe('configuration filters', () => {
      it('should match factory PID filters with wildcards', () => {
        const filter = new LDAPFilter('(service.factoryPid=database.*)');

        expect(filter.match({ 'service.factoryPid': 'database.connection' })).toBe(true);
        expect(filter.match({ 'service.factoryPid': 'database.pool' })).toBe(true);
        expect(filter.match({ 'service.factoryPid': 'logger.factory' })).toBe(false);
      });

      it('should match environment filters', () => {
        const filter = new LDAPFilter('(environment=production)');

        expect(filter.match({ environment: 'production' })).toBe(true);
        expect(filter.match({ environment: 'development' })).toBe(false);
      });

      it('should match priority comparison filters', () => {
        const filter = new LDAPFilter('(priority>=10)');

        expect(filter.match({ priority: '10' })).toBe(true);
        expect(filter.match({ priority: '15' })).toBe(true);
        expect(filter.match({ priority: '9' })).toBe(false);
        expect(filter.match({ priority: '05' })).toBe(false);
      });

      it('should match complex cache configuration filters', () => {
        const filter = new LDAPFilter('(&(type=cache)(|(size>=1000)(memory>=512)))');

        expect(filter.match({ type: 'cache', size: '1000' })).toBe(true);
        expect(filter.match({ type: 'cache', memory: '512' })).toBe(true);
        expect(filter.match({ type: 'cache', size: '2000', memory: '1024' })).toBe(true);
        expect(filter.match({ type: 'cache', size: '100', memory: '256' })).toBe(false);
        expect(filter.match({ type: 'database', size: '1000' })).toBe(false);
      });
    });

    describe('service listener object class filters', () => {
      it('should match DatabaseService object class', () => {
        const filter = new LDAPFilter('(objectClass=DatabaseService)');

        expect(filter.match({ objectClass: 'DatabaseService' })).toBe(true);
        expect(filter.match({ objectClass: 'LogService' })).toBe(false);
      });
    });
  });
});
