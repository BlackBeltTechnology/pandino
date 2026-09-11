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
 *
 * Cases are tables of `[description, filter, properties, expected]` so that a
 * new case is one row rather than another copy of the assertion.
 */
type MatchCase = [description: string, filter: string, properties: Record<string, any>, expected: boolean];

/** Runs a table of match cases, one test per row. */
const itMatches = (cases: MatchCase[]) =>
  it.each(cases)('%s', (_description, filter, properties, expected) => {
    expect(new LDAPFilter(filter).match(properties)).toBe(expected);
  });

describe('LDAPFilter grammar', () => {
  describe('equality operator (=)', () => {
    itMatches([
      ['matches an exact value', '(cn=Service)', { cn: 'Service' }, true],
      ['rejects a different value', '(cn=Service)', { cn: 'Component' }, false],
      ['is case-sensitive (lowercase)', '(cn=Service)', { cn: 'service' }, false],
      ['is case-sensitive (uppercase)', '(cn=Service)', { cn: 'SERVICE' }, false],
      ['rejects a missing property', '(cn=Service)', {}, false],
      ['rejects when only another property is present', '(cn=Service)', { other: 'Service' }, false],
      ['coerces a number property with String()', '(port=8080)', { port: 8080 }, true],
      ['coerces a true boolean property with String()', '(active=true)', { active: true }, true],
      ['coerces a false boolean property with String()', '(active=true)', { active: false }, false],
    ]);
  });

  describe('presence operator (x=*)', () => {
    itMatches([
      ['matches any defined value', '(cn=*)', { cn: 'anything' }, true],
      ['matches an empty string', '(cn=*)', { cn: '' }, true],
      ['matches zero', '(cn=*)', { cn: 0 }, true],
      ['matches false', '(cn=*)', { cn: false }, true],
      ['does not match null', '(cn=*)', { cn: null }, false],
      ['does not match undefined', '(cn=*)', { cn: undefined }, false],
      ['does not match a missing property', '(cn=*)', {}, false],
    ]);
  });

  describe('greater-than-or-equal operator (>=)', () => {
    itMatches([
      ['compares string operands (greater)', '(v>=1.5)', { v: '2.0' }, true],
      ['compares string operands (equal)', '(v>=1.5)', { v: '1.5' }, true],
      ['compares string operands (lesser)', '(v>=1.5)', { v: '1.0' }, false],
      // Lexicographically '9' > '10'; numeric coercion makes 10 >= 9 true.
      ['coerces numeric strings', '(v>=9)', { v: '10' }, true],
      ['coerces numeric strings (negative case)', '(v>=10)', { v: '9' }, false],
      ['coerces a real number property', '(v>=9)', { v: 10 }, true],
      ['coerces a real number property (negative case)', '(v>=10)', { v: 9 }, false],
      ['falls back to lexicographic compare', '(v>=apple)', { v: 'banana' }, true],
      ['falls back to lexicographic compare (negative case)', '(v>=banana)', { v: 'apple' }, false],
    ]);
  });

  describe('less-than-or-equal operator (<=)', () => {
    itMatches([
      ['compares string operands (lesser)', '(v<=2.0)', { v: '1.5' }, true],
      ['compares string operands (equal)', '(v<=2.0)', { v: '2.0' }, true],
      ['compares string operands (greater)', '(v<=2.0)', { v: '3.0' }, false],
      ['coerces numeric strings', '(v<=100)', { v: '99' }, true],
      // Lexicographically '100' < '99'; numeric coercion makes 100 <= 99 false.
      ['coerces numeric strings (negative case)', '(v<=99)', { v: '100' }, false],
    ]);
  });

  describe('substring / wildcard globbing', () => {
    itMatches([
      ['prefix pattern matches a longer value', '(cn=test*)', { cn: 'test-service' }, true],
      ['prefix pattern matches the bare prefix', '(cn=test*)', { cn: 'test' }, true],
      ['prefix pattern is anchored at the start', '(cn=test*)', { cn: 'a-test' }, false],
      ['suffix pattern matches a longer value', '(cn=*service)', { cn: 'my-service' }, true],
      ['suffix pattern matches the bare suffix', '(cn=*service)', { cn: 'service' }, true],
      ['suffix pattern is anchored at the end', '(cn=*service)', { cn: 'service-x' }, false],
      ['infix pattern matches a surrounded value', '(cn=*test*)', { cn: 'my-test-service' }, true],
      ['infix pattern matches the bare infix', '(cn=*test*)', { cn: 'test' }, true],
      ['infix pattern rejects a non-match', '(cn=*test*)', { cn: 'service' }, false],
      ['multiple wildcards match', '(cn=*-*-*)', { cn: 'a-b-c' }, true],
      ['multiple wildcards match around literals', '(cn=pre*mid*suf)', { cn: 'pre-mid-suf' }, true],
      ['multiple wildcards reject a non-match', '(cn=pre*suf)', { cn: 'nomatch' }, false],
      // Wildcard match is compiled to ^...$, so a bare literal must match fully.
      ['a bare literal must match the whole value', '(cn=mid)', { cn: 'a-mid-b' }, false],
      ['an infix pattern matches within a value', '(cn=*mid*)', { cn: 'a-mid-b' }, true],
    ]);
  });

  describe('escaping', () => {
    itMatches([
      ['escaped opening parenthesis is literal', '(cn=a\\(b)', { cn: 'a(b' }, true],
      ['escaped closing parenthesis is literal', '(cn=a\\)b)', { cn: 'a)b' }, true],
      ['escaped backslash is a literal backslash', '(cn=a\\\\b)', { cn: 'a\\b' }, true],
      ['escaped asterisk matches a literal asterisk', '(cn=a\\*b)', { cn: 'a*b' }, true],
      ['escaped asterisk does not act as a wildcard', '(cn=a\\*b)', { cn: 'axb' }, false],
    ]);
  });

  describe('logical operators', () => {
    itMatches([
      ['AND (&) matches when every child matches', '(&(cn=Service)(v>=1.0))', { cn: 'Service', v: '1.5' }, true],
      ['AND (&) fails on a non-matching second child', '(&(cn=Service)(v>=1.0))', { cn: 'Service', v: '0.5' }, false],
      ['AND (&) fails on a non-matching first child', '(&(cn=Service)(v>=1.0))', { cn: 'Component', v: '1.5' }, false],
      ['OR (|) matches on the first child', '(|(cn=Service)(cn=Component))', { cn: 'Service' }, true],
      ['OR (|) matches on the second child', '(|(cn=Service)(cn=Component))', { cn: 'Component' }, true],
      ['OR (|) fails when no child matches', '(|(cn=Service)(cn=Component))', { cn: 'Other' }, false],
      ['NOT (!) inverts a non-matching child', '(!(cn=Service))', { cn: 'Component' }, true],
      ['NOT (!) inverts a matching child', '(!(cn=Service))', { cn: 'Service' }, false],
      ['NOT (!) matches when the property is absent', '(!(cn=Service))', {}, true],
      // Proves the overall result is false once the first clause fails.
      [
        'AND (&) short-circuits on the first non-matching child',
        '(&(cn=Service)(v>=1.0))',
        { cn: 'Other', v: '5.0' },
        false,
      ],
      ['OR (|) short-circuits on the first matching child', '(|(cn=Service)(v>=1.0))', { cn: 'Service' }, true],
      [
        'deep nesting of &, | and ! matches',
        '(&(|(cn=Service)(cn=Component))(!(status=inactive))(&(v>=1.0)(v<=9.0)))',
        { cn: 'Service', status: 'active', v: '2.0' },
        true,
      ],
      [
        'deep nesting matches the alternative branch',
        '(&(|(cn=Service)(cn=Component))(!(status=inactive))(&(v>=1.0)(v<=9.0)))',
        { cn: 'Component', status: 'active', v: '9.0' },
        true,
      ],
      [
        'deep nesting fails on the negated clause',
        '(&(|(cn=Service)(cn=Component))(!(status=inactive))(&(v>=1.0)(v<=9.0)))',
        { cn: 'Service', status: 'inactive', v: '2.0' },
        false,
      ],
      [
        'deep nesting fails on the OR clause',
        '(&(|(cn=Service)(cn=Component))(!(status=inactive))(&(v>=1.0)(v<=9.0)))',
        { cn: 'Other', status: 'active', v: '2.0' },
        false,
      ],
      [
        'deep nesting fails on the range clause',
        '(&(|(cn=Service)(cn=Component))(!(status=inactive))(&(v>=1.0)(v<=9.0)))',
        { cn: 'Service', status: 'active', v: '10.0' },
        false,
      ],
      ['empty AND matches everything', '(&)', { anything: 'x' }, true],
      ['empty OR matches nothing', '(|)', { anything: 'x' }, false],
    ]);
  });

  describe('multi-valued / array properties', () => {
    itMatches([
      ['matches the first array member', '(x=a)', { x: ['a', 'b'] }, true],
      ['matches a later array member', '(x=b)', { x: ['a', 'b'] }, true],
      ['fails when no array member equals the value', '(x=c)', { x: ['a', 'b'] }, false],
      ['matches if any member satisfies >=', '(x>=2)', { x: [1, 3] }, true],
      ['fails if no member satisfies >=', '(x>=5)', { x: [1, 3] }, false],
      ['presence matches a non-empty array', '(x=*)', { x: ['a', 'b'] }, true],
      ['a suffix wildcard matches a member', '(x=*b)', { x: ['a', 'b'] }, true],
      ['a prefix wildcard matches a member', '(x=a*)', { x: ['a', 'b'] }, true],
    ]);
  });

  describe('malformed filters (rejected at construction)', () => {
    it.each([
      ['not enclosed in parentheses', 'cn=Service', 'Filter must be enclosed in parentheses'],
      ['an unclosed opening parenthesis', '(cn=Service', 'Filter must be enclosed in parentheses'],
      ['a stray closing parenthesis', 'cn=Service)', 'Filter must be enclosed in parentheses'],
      ['an empty filter with no operator', '()', 'Invalid filter syntax'],
      ['a bare item with no operator', '(nooperator)', 'Invalid filter syntax'],
      ['a NOT filter whose child is not parenthesized', '(!cn=Service)', 'Invalid NOT filter syntax'],
    ])('throws for %s', (_description, filter, message) => {
      expect(() => new LDAPFilter(filter)).toThrow(message);
    });
  });
});
