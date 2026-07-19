import { describe, it, expect } from 'vitest';
import { versionMatches, compareVersions } from '../version-utils';

/**
 * Group 5: version range matching.
 *
 * These tests target the range-matching semantics of `versionMatches` and the
 * padding semantics of `compareVersions` at a finer granularity than the
 * existing `version-utils.test.ts` suite (which covers the four bracket combos
 * at `.0.0` granularity). Focus here: exact boundary inclusion/exclusion,
 * open-ended / lower-bounded ranges, and zero-padding of missing components.
 *
 * Where behavior diverges from the OSGi Version Range spec, the ACTUAL result
 * is asserted and annotated with a `// DIVERGENCE:` comment. No source is
 * modified.
 */
describe('Version Ranges', () => {
  describe('bracket boundary inclusion/exclusion', () => {
    it('[a,b] includes both endpoints', () => {
      expect(versionMatches('1.0.0', '[1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('2.0.0', '[1.0.0,2.0.0]')).toBe(true);
    });

    it('[a,b) includes lower, excludes upper', () => {
      expect(versionMatches('1.0.0', '[1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('2.0.0', '[1.0.0,2.0.0)')).toBe(false);
    });

    it('(a,b] excludes lower, includes upper', () => {
      expect(versionMatches('1.0.0', '(1.0.0,2.0.0]')).toBe(false);
      expect(versionMatches('2.0.0', '(1.0.0,2.0.0]')).toBe(true);
    });

    it('(a,b) excludes both endpoints', () => {
      expect(versionMatches('1.0.0', '(1.0.0,2.0.0)')).toBe(false);
      expect(versionMatches('2.0.0', '(1.0.0,2.0.0)')).toBe(false);
    });

    it('the smallest step past an exclusive lower bound is included', () => {
      expect(versionMatches('1.0.1', '(1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.0.1', '(1.0.0,2.0.0]')).toBe(true);
    });

    it('the smallest step below an exclusive upper bound is included', () => {
      expect(versionMatches('1.9.9', '[1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.9.9', '(1.0.0,2.0.0)')).toBe(true);
    });

    it('values strictly outside the range are rejected regardless of brackets', () => {
      expect(versionMatches('0.9.9', '[1.0.0,2.0.0]')).toBe(false);
      expect(versionMatches('2.0.1', '[1.0.0,2.0.0]')).toBe(false);
      expect(versionMatches('0.9.9', '(1.0.0,2.0.0)')).toBe(false);
      expect(versionMatches('2.0.1', '(1.0.0,2.0.0)')).toBe(false);
    });
  });

  describe('open-ended and lower-bounded ranges', () => {
    it('[1.0,) matches anything at or above the inclusive lower bound', () => {
      expect(versionMatches('1.0', '[1.0,)')).toBe(true);
      expect(versionMatches('1.0.1', '[1.0,)')).toBe(true);
      expect(versionMatches('99.0.0', '[1.0,)')).toBe(true);
    });

    it('[1.0,) rejects versions below the lower bound', () => {
      expect(versionMatches('0.9', '[1.0,)')).toBe(false);
      expect(versionMatches('0.9.9', '[1.0,)')).toBe(false);
    });

    it('(1.0,) excludes the lower bound itself', () => {
      expect(versionMatches('1.0', '(1.0,)')).toBe(false);
      expect(versionMatches('1.0.1', '(1.0,)')).toBe(true);
    });

    it('a single version in brackets acts as a lower-bound-only open range', () => {
      // DIVERGENCE: In the OSGi spec `[1.0]` denotes the single exact version
      // 1.0. Here the range has no comma, so `endVersion` is undefined and only
      // the inclusive lower-bound check runs — `[1.0]` behaves like `[1.0,)`.
      expect(versionMatches('2.0', '[1.0]')).toBe(true);
      expect(versionMatches('0.5', '[1.0]')).toBe(false);
      expect(versionMatches('1.0', '[1.0]')).toBe(true);
    });

    it('an exclusive single version in brackets excludes the bound and matches above', () => {
      // DIVERGENCE: `(1.0)` is not a valid OSGi range; here it degrades to an
      // exclusive lower-bound-only open range.
      expect(versionMatches('1.0', '(1.0)')).toBe(false);
      expect(versionMatches('1.0.1', '(1.0)')).toBe(true);
    });
  });

  describe('zero-padding of missing minor/patch components', () => {
    it('compareVersions treats 1.0 as equal to 1.0.0', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0.0', '1.0.0')).toBe(0);
    });

    it('padded versions land on inclusive/exclusive boundaries correctly', () => {
      // '1.0' pads to '1.0.0' → equals the inclusive lower bound.
      expect(versionMatches('1.0', '[1.0.0,2.0.0)')).toBe(true);
      // '2.0' pads to '2.0.0' → equals the exclusive upper bound → rejected.
      expect(versionMatches('2.0', '[1.0.0,2.0.0)')).toBe(false);
      // '2.0' equals the inclusive upper bound → accepted.
      expect(versionMatches('2.0', '[1.0.0,2.0.0]')).toBe(true);
    });

    it('padded versions compare across granularities inside a range', () => {
      expect(versionMatches('1', '[1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.5', '(1.0.0,2.0.0)')).toBe(true);
    });

    it('exact (non-bracket) matching is value-based (zero-padded comparison)', () => {
      expect(versionMatches('1.0', '1.0.0')).toBe(true);
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(versionMatches('1.0.0', '1.0.0')).toBe(true);
      expect(versionMatches('1.0.1', '1.0.0')).toBe(false);
    });
  });
});
