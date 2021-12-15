import { isAnyMissing, isAllPresent } from './helpers';

describe('helpers', () => {
  describe('isNoneMissing', () => {
    it('returns true for single undefined', () => {
      expect(isAnyMissing(undefined)).toEqual(true);
    });

    it('returns true for single null', () => {
      expect(isAnyMissing(null)).toEqual(true);
    });

    it('returns false for others', () => {
      expect(isAnyMissing(1)).toEqual(false);
      expect(isAnyMissing('hello')).toEqual(false);
      expect(isAnyMissing('{}')).toEqual(false);
      expect(isAnyMissing(() => {})).toEqual(false);
      expect(isAnyMissing(new Date())).toEqual(false);
    });
  });

  describe('isAllPresent', () => {
    it('returns false for single undefined', () => {
      expect(isAllPresent(undefined)).toEqual(false);
    });

    it('returns false for single null', () => {
      expect(isAllPresent(null)).toEqual(false);
    });

    it('returns true for others', () => {
      expect(isAllPresent(1)).toEqual(true);
      expect(isAllPresent('hello')).toEqual(true);
      expect(isAllPresent('{}')).toEqual(true);
      expect(isAllPresent(() => {})).toEqual(true);
      expect(isAllPresent(new Date())).toEqual(true);
    });
  });
});
