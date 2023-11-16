import { describe, expect, it } from 'vitest';
import { Matchers } from './matchers';
import type { Matcher } from './matcher';

type TestPair = [string, boolean];

describe('Matchers', () => {
  describe('Package', () => {
    it('no config', () => {
      expect(Matchers.createPackageMatchers()).toEqual([]);
      expect(Matchers.createPackageMatchers([])).toEqual([]);
    });

    it('exact', () => {
      const m: Matcher[] = Matchers.createPackageMatchers(['@pandino/pandino/Foo']);
      expect(m.length).toEqual(1);
      expect(m[0]).toBeDefined();

      testAll(m[0], [
        ['@pandino/pandino/Foo', true],
        ['@pandino/pandino/Bar', false],
        ['@pandino/pandino/Foo$1', false],
        ['@pandino/pandino/Foo/Test', false],
        ['@pandino/pandino', false],
      ]);
    });

    it('package', () => {
      const m: Matcher[] = Matchers.createPackageMatchers(['@pandino/pandino.']);
      expect(m.length).toEqual(1);
      expect(m[0]).toBeDefined();

      testAll(m[0], [
        ['@pandino/pandino/Foo', true],
        ['@pandino/pandino/Bar', true],
        ['@pandino/pandino/Foo$1', true],
        ['@pandino/pandino/Foo/Test', false],
        ['@pandino/pandino', false],
      ]);
    });

    it('sub-package', () => {
      const m: Matcher[] = Matchers.createPackageMatchers(['@pandino/pandino*']);
      expect(m.length).toEqual(1);
      expect(m[0]).toBeDefined();

      testAll(m[0], [
        ['@pandino/pandino/Foo', true],
        ['@pandino/pandino/Bar', true],
        ['@pandino/pandino/Foo$1', true],
        ['@pandino/pandino/Foo/Test', true],
        ['@pandino/pandino', false],
      ]);
    });
  });

  describe('Topic', () => {
    it('no config', () => {
      expect(Matchers.createEventTopicMatchers()).toEqual([]);
      expect(Matchers.createEventTopicMatchers([])).toEqual([]);
    });

    it('exact', () => {
      const m: Matcher[] = Matchers.createEventTopicMatchers(['@pandino/pandino/Foo']);
      expect(m.length).toEqual(1);
      expect(m[0]).toBeDefined();

      testAll(m[0], [
        ['@pandino/pandino/Foo', true],
        ['@pandino/pandino/Bar', false],
        ['@pandino/pandino/Foo$1', false],
        ['@pandino/pandino/Foo/Test', false],
        ['@pandino/pandino', false],
      ]);
    });

    it('package', () => {
      const m: Matcher[] = Matchers.createEventTopicMatchers(['@pandino/pandino.']);
      expect(m.length).toEqual(1);
      expect(m[0]).toBeDefined();

      testAll(m[0], [
        ['@pandino/pandino/Foo', true],
        ['@pandino/pandino/Bar', true],
        ['@pandino/pandino/Foo$1', true],
        ['@pandino/pandino/Foo/Test', false],
        ['@pandino/pandino', false],
      ]);
    });

    it('sub-package', () => {
      const m: Matcher[] = Matchers.createEventTopicMatchers(['@pandino/pandino*']);
      expect(m.length).toEqual(1);
      expect(m[0]).toBeDefined();

      testAll(m[0], [
        ['@pandino/pandino/Foo', true],
        ['@pandino/pandino/Bar', true],
        ['@pandino/pandino/Foo$1', true],
        ['@pandino/pandino/Foo/Test', true],
        ['@pandino/pandino', false],
      ]);
    });
  });

  function testAll(matcher: Matcher, pairs: TestPair[]): void {
    pairs.forEach(([className, assertion]) => testMatch(matcher, className, assertion));
  }

  function testMatch(matcher: Matcher, className: string, assertion: boolean): void {
    expect(matcher.match(className)).toEqual(assertion);
  }
});
