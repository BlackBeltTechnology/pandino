import { describe, expect, it } from 'vitest';
import { parseDelimitedString } from './utils';

describe('ManifestParser utils', () => {
  it('parseDelimitedString for missing value returns empty array', () => {
    expect(parseDelimitedString(null, ',')).toEqual([]);
  });
});
