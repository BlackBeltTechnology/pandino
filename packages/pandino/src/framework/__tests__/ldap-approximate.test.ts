import { describe, expect, it } from 'vitest';
import { LDAPFilter } from '../ldap-filter';

/**
 * OSGi Core filter grammar (§3.2.7) approximate-match operator `~=`.
 * OSGi leaves the exact algorithm implementation-defined; this port compares
 * values case-insensitively after stripping whitespace.
 */
describe('LDAPFilter approximate match (~=)', () => {
  it('should match values that differ only by case', () => {
    expect(new LDAPFilter('(name~=Smith)').match({ name: 'smith' })).toBe(true);
    expect(new LDAPFilter('(name~=SMITH)').match({ name: 'Smith' })).toBe(true);
  });

  it('should match values that differ only by whitespace', () => {
    expect(new LDAPFilter('(name~=John Smith)').match({ name: 'johnsmith' })).toBe(true);
    expect(new LDAPFilter('(name~=a b c)').match({ name: 'ABC' })).toBe(true);
  });

  it('should not match genuinely different values', () => {
    expect(new LDAPFilter('(name~=Smith)').match({ name: 'Smyth' })).toBe(false);
  });

  it('should not match when the property is missing', () => {
    expect(new LDAPFilter('(name~=Smith)').match({ other: 'Smith' })).toBe(false);
  });

  it('should coerce non-string values before comparing', () => {
    expect(new LDAPFilter('(port~=8080)').match({ port: 8080 })).toBe(true);
  });

  it('should participate in composite expressions', () => {
    const filter = new LDAPFilter('(&(name~=Foo Bar)(active=true))');
    expect(filter.match({ name: 'foobar', active: 'true' })).toBe(true);
    expect(filter.match({ name: 'foobar', active: 'false' })).toBe(false);
  });
});
