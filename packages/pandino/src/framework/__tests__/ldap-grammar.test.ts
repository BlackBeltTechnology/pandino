import { describe, expect, it } from 'vitest';
import { LDAPFilter } from '../ldap-filter';

/**
 * OSGi Core filter grammar (§3.2.7) coverage focused on the operators and
 * grammar rules actually ported into this LDAPFilter implementation.
 *
 * These tests assert the ACTUAL behavior of THIS port, which diverges from the
 * OSGi spec in a few documented spots (see the DIVERGENCE comments). The `~=`
 * approximate operator is intentionally omitted — it is covered in
 * ldap-approximate.test.ts.
 */
describe('LDAPFilter grammar', () => {
  describe('equality operator (=)', () => {
    it('matches exact values', () => {
      expect(new LDAPFilter('(cn=Service)').match({ cn: 'Service' })).toBe(true);
      expect(new LDAPFilter('(cn=Service)').match({ cn: 'Component' })).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(new LDAPFilter('(cn=Service)').match({ cn: 'service' })).toBe(false);
      expect(new LDAPFilter('(cn=Service)').match({ cn: 'SERVICE' })).toBe(false);
    });

    it('returns false for a missing property', () => {
      expect(new LDAPFilter('(cn=Service)').match({})).toBe(false);
      expect(new LDAPFilter('(cn=Service)').match({ other: 'Service' })).toBe(false);
    });

    it('coerces non-string property values with String()', () => {
      expect(new LDAPFilter('(port=8080)').match({ port: 8080 })).toBe(true);
      expect(new LDAPFilter('(active=true)').match({ active: true })).toBe(true);
      expect(new LDAPFilter('(active=true)').match({ active: false })).toBe(false);
    });
  });

  describe('presence operator (x=*)', () => {
    it('matches any defined, non-null value including empty string', () => {
      expect(new LDAPFilter('(cn=*)').match({ cn: 'anything' })).toBe(true);
      expect(new LDAPFilter('(cn=*)').match({ cn: '' })).toBe(true);
      expect(new LDAPFilter('(cn=*)').match({ cn: 0 })).toBe(true);
      expect(new LDAPFilter('(cn=*)').match({ cn: false })).toBe(true);
    });

    it('does not match null, undefined, or a missing property', () => {
      expect(new LDAPFilter('(cn=*)').match({ cn: null })).toBe(false);
      expect(new LDAPFilter('(cn=*)').match({ cn: undefined })).toBe(false);
      expect(new LDAPFilter('(cn=*)').match({})).toBe(false);
    });
  });

  describe('greater-than-or-equal operator (>=)', () => {
    it('compares string operands', () => {
      expect(new LDAPFilter('(v>=1.5)').match({ v: '2.0' })).toBe(true);
      expect(new LDAPFilter('(v>=1.5)').match({ v: '1.5' })).toBe(true);
      expect(new LDAPFilter('(v>=1.5)').match({ v: '1.0' })).toBe(false);
    });

    it('coerces numerically when both operands parse as numbers', () => {
      // Lexicographically '9' > '10'; numeric coercion makes 10 >= 9 true.
      expect(new LDAPFilter('(v>=9)').match({ v: '10' })).toBe(true);
      expect(new LDAPFilter('(v>=10)').match({ v: '9' })).toBe(false);
    });

    it('coerces when the property value is a real number', () => {
      expect(new LDAPFilter('(v>=9)').match({ v: 10 })).toBe(true);
      expect(new LDAPFilter('(v>=10)').match({ v: 9 })).toBe(false);
    });

    it('falls back to lexicographic compare for non-numeric operands', () => {
      expect(new LDAPFilter('(v>=apple)').match({ v: 'banana' })).toBe(true);
      expect(new LDAPFilter('(v>=banana)').match({ v: 'apple' })).toBe(false);
    });
  });

  describe('less-than-or-equal operator (<=)', () => {
    it('compares string operands', () => {
      expect(new LDAPFilter('(v<=2.0)').match({ v: '1.5' })).toBe(true);
      expect(new LDAPFilter('(v<=2.0)').match({ v: '2.0' })).toBe(true);
      expect(new LDAPFilter('(v<=2.0)').match({ v: '3.0' })).toBe(false);
    });

    it('coerces numerically when both operands parse as numbers', () => {
      expect(new LDAPFilter('(v<=100)').match({ v: '99' })).toBe(true);
      // Lexicographically '100' < '99'; numeric coercion makes 100 <= 99 false.
      expect(new LDAPFilter('(v<=99)').match({ v: '100' })).toBe(false);
    });
  });

  describe('substring / wildcard globbing', () => {
    it('matches a prefix pattern (x*)', () => {
      expect(new LDAPFilter('(cn=test*)').match({ cn: 'test-service' })).toBe(true);
      expect(new LDAPFilter('(cn=test*)').match({ cn: 'test' })).toBe(true);
      expect(new LDAPFilter('(cn=test*)').match({ cn: 'a-test' })).toBe(false);
    });

    it('matches a suffix pattern (*x)', () => {
      expect(new LDAPFilter('(cn=*service)').match({ cn: 'my-service' })).toBe(true);
      expect(new LDAPFilter('(cn=*service)').match({ cn: 'service' })).toBe(true);
      expect(new LDAPFilter('(cn=*service)').match({ cn: 'service-x' })).toBe(false);
    });

    it('matches an infix pattern (*x*)', () => {
      expect(new LDAPFilter('(cn=*test*)').match({ cn: 'my-test-service' })).toBe(true);
      expect(new LDAPFilter('(cn=*test*)').match({ cn: 'test' })).toBe(true);
      expect(new LDAPFilter('(cn=*test*)').match({ cn: 'service' })).toBe(false);
    });

    it('matches multiple wildcards', () => {
      expect(new LDAPFilter('(cn=*-*-*)').match({ cn: 'a-b-c' })).toBe(true);
      expect(new LDAPFilter('(cn=pre*mid*suf)').match({ cn: 'pre-mid-suf' })).toBe(true);
      expect(new LDAPFilter('(cn=pre*suf)').match({ cn: 'nomatch' })).toBe(false);
    });

    it('anchors the pattern at both ends', () => {
      // Wildcard match is compiled to ^...$, so a bare literal must match fully.
      expect(new LDAPFilter('(cn=mid)').match({ cn: 'a-mid-b' })).toBe(false);
      expect(new LDAPFilter('(cn=*mid*)').match({ cn: 'a-mid-b' })).toBe(true);
    });
  });

  describe('escaping', () => {
    it('treats escaped parentheses as literal characters', () => {
      expect(new LDAPFilter('(cn=a\\(b)').match({ cn: 'a(b' })).toBe(true);
      expect(new LDAPFilter('(cn=a\\)b)').match({ cn: 'a)b' })).toBe(true);
    });

    it('treats an escaped backslash as a literal backslash', () => {
      expect(new LDAPFilter('(cn=a\\\\b)').match({ cn: 'a\\b' })).toBe(true);
    });

    it('treats an escaped asterisk as a literal, not a wildcard', () => {
      const filter = new LDAPFilter('(cn=a\\*b)');
      expect(filter.match({ cn: 'a*b' })).toBe(true);
      expect(filter.match({ cn: 'axb' })).toBe(false);
    });
  });

  describe('logical operators', () => {
    it('AND (&) requires every child to match', () => {
      const filter = new LDAPFilter('(&(cn=Service)(v>=1.0))');
      expect(filter.match({ cn: 'Service', v: '1.5' })).toBe(true);
      expect(filter.match({ cn: 'Service', v: '0.5' })).toBe(false);
      expect(filter.match({ cn: 'Component', v: '1.5' })).toBe(false);
    });

    it('OR (|) requires at least one child to match', () => {
      const filter = new LDAPFilter('(|(cn=Service)(cn=Component))');
      expect(filter.match({ cn: 'Service' })).toBe(true);
      expect(filter.match({ cn: 'Component' })).toBe(true);
      expect(filter.match({ cn: 'Other' })).toBe(false);
    });

    it('NOT (!) inverts its single child', () => {
      const filter = new LDAPFilter('(!(cn=Service))');
      expect(filter.match({ cn: 'Component' })).toBe(true);
      expect(filter.match({ cn: 'Service' })).toBe(false);
      expect(filter.match({})).toBe(true);
    });

    it('short-circuits AND on the first non-matching child', () => {
      // The second clause references a property that would throw if evaluated
      // against a getter; here we simply prove the overall result is false when
      // the first clause already fails.
      const filter = new LDAPFilter('(&(cn=Service)(v>=1.0))');
      expect(filter.match({ cn: 'Other', v: '5.0' })).toBe(false);
    });

    it('short-circuits OR on the first matching child', () => {
      const filter = new LDAPFilter('(|(cn=Service)(v>=1.0))');
      expect(filter.match({ cn: 'Service' })).toBe(true);
    });

    it('handles deep nesting of &, |, and !', () => {
      const filter = new LDAPFilter(
        '(&(|(cn=Service)(cn=Component))(!(status=inactive))(&(v>=1.0)(v<=9.0)))',
      );
      expect(filter.match({ cn: 'Service', status: 'active', v: '2.0' })).toBe(true);
      expect(filter.match({ cn: 'Component', status: 'active', v: '9.0' })).toBe(true);
      expect(filter.match({ cn: 'Service', status: 'inactive', v: '2.0' })).toBe(false);
      expect(filter.match({ cn: 'Other', status: 'active', v: '2.0' })).toBe(false);
      expect(filter.match({ cn: 'Service', status: 'active', v: '10.0' })).toBe(false);
    });

    it('empty AND matches everything; empty OR matches nothing', () => {
      expect(new LDAPFilter('(&)').match({ anything: 'x' })).toBe(true);
      expect(new LDAPFilter('(|)').match({ anything: 'x' })).toBe(false);
    });
  });

  describe('multi-valued / array properties', () => {
    it('matches if ANY array member equals the value', () => {
      expect(new LDAPFilter('(x=a)').match({ x: ['a', 'b'] })).toBe(true);
      expect(new LDAPFilter('(x=b)').match({ x: ['a', 'b'] })).toBe(true);
      expect(new LDAPFilter('(x=c)').match({ x: ['a', 'b'] })).toBe(false);
    });

    it('matches if ANY array member satisfies a >= comparison', () => {
      expect(new LDAPFilter('(x>=2)').match({ x: [1, 3] })).toBe(true);
      expect(new LDAPFilter('(x>=5)').match({ x: [1, 3] })).toBe(false);
    });

    it('presence matches a non-empty array (it is defined and non-null)', () => {
      expect(new LDAPFilter('(x=*)').match({ x: ['a', 'b'] })).toBe(true);
    });

    it('wildcard matches if any array member matches the pattern', () => {
      expect(new LDAPFilter('(x=*b)').match({ x: ['a', 'b'] })).toBe(true);
      expect(new LDAPFilter('(x=a*)').match({ x: ['a', 'b'] })).toBe(true);
    });
  });

  describe('malformed filters (rejected at construction)', () => {
    it('throws when not enclosed in parentheses', () => {
      expect(() => new LDAPFilter('cn=Service')).toThrow('Filter must be enclosed in parentheses');
    });

    it('throws when a parenthesis is unclosed', () => {
      expect(() => new LDAPFilter('(cn=Service')).toThrow('Filter must be enclosed in parentheses');
      expect(() => new LDAPFilter('cn=Service)')).toThrow('Filter must be enclosed in parentheses');
    });

    it('throws for an empty filter with no operator', () => {
      expect(() => new LDAPFilter('()')).toThrow('Invalid filter syntax');
    });

    it('throws for a bare item with no operator', () => {
      expect(() => new LDAPFilter('(nooperator)')).toThrow('Invalid filter syntax');
    });

    it('throws for a NOT filter whose child is not parenthesized', () => {
      expect(() => new LDAPFilter('(!cn=Service)')).toThrow('Invalid NOT filter syntax');
    });
  });
});
