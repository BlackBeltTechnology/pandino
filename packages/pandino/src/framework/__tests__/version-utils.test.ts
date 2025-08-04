import { describe, it, expect } from 'vitest';
import { parseFragmentHost, versionMatches, compareVersions } from '../version-utils';

describe('Version Utilities', () => {
  describe('parseFragmentHost', () => {
    it('should parse a simple fragment host', () => {
      const [symbolicName, versionRange] = parseFragmentHost('com.example.host');
      expect(symbolicName).toBe('com.example.host');
      expect(versionRange).toBeNull();
    });

    it('should parse a fragment host with a version', () => {
      const [symbolicName, versionRange] = parseFragmentHost('com.example.host;bundle-version="1.0.0"');
      expect(symbolicName).toBe('com.example.host');
      expect(versionRange).toBe('1.0.0');
    });

    it('should parse a fragment host with a version range', () => {
      const [symbolicName, versionRange] = parseFragmentHost('com.example.host;bundle-version="[1.0.0,2.0.0)"');
      expect(symbolicName).toBe('com.example.host');
      expect(versionRange).toBe('[1.0.0,2.0.0)');
    });

    it('should handle multiple parameters', () => {
      const [symbolicName, versionRange] = parseFragmentHost(
        'com.example.host;param1=value1;bundle-version="1.0.0";param2=value2',
      );
      expect(symbolicName).toBe('com.example.host');
      expect(versionRange).toBe('1.0.0');
    });
  });

  describe('versionMatches', () => {
    it('should match exact versions', () => {
      expect(versionMatches('1.0.0', '1.0.0')).toBe(true);
      expect(versionMatches('1.0.0', '1.0.1')).toBe(false);
      expect(versionMatches('1.0.0', '1.1.0')).toBe(false);
    });

    it('should match inclusive start, exclusive end ranges', () => {
      // [1.0.0,2.0.0) - versions from 1.0.0 (inclusive) to 2.0.0 (exclusive)
      expect(versionMatches('1.0.0', '[1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.5.0', '[1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.9.9', '[1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('2.0.0', '[1.0.0,2.0.0)')).toBe(false);
      expect(versionMatches('0.9.9', '[1.0.0,2.0.0)')).toBe(false);
    });

    it('should match exclusive start, inclusive end ranges', () => {
      // (1.0.0,2.0.0] - versions from 1.0.0 (exclusive) to 2.0.0 (inclusive)
      expect(versionMatches('1.0.0', '(1.0.0,2.0.0]')).toBe(false);
      expect(versionMatches('1.0.1', '(1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('1.5.0', '(1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('2.0.0', '(1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('2.0.1', '(1.0.0,2.0.0]')).toBe(false);
    });

    it('should match inclusive start, inclusive end ranges', () => {
      // [1.0.0,2.0.0] - versions from 1.0.0 (inclusive) to 2.0.0 (inclusive)
      expect(versionMatches('1.0.0', '[1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('1.5.0', '[1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('2.0.0', '[1.0.0,2.0.0]')).toBe(true);
      expect(versionMatches('0.9.9', '[1.0.0,2.0.0]')).toBe(false);
      expect(versionMatches('2.0.1', '[1.0.0,2.0.0]')).toBe(false);
    });

    it('should match exclusive start, exclusive end ranges', () => {
      // (1.0.0,2.0.0) - versions from 1.0.0 (exclusive) to 2.0.0 (exclusive)
      expect(versionMatches('1.0.0', '(1.0.0,2.0.0)')).toBe(false);
      expect(versionMatches('1.0.1', '(1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.5.0', '(1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('1.9.9', '(1.0.0,2.0.0)')).toBe(true);
      expect(versionMatches('2.0.0', '(1.0.0,2.0.0)')).toBe(false);
    });
  });

  describe('compareVersions', () => {
    it('should compare equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
      expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
    });

    it('should compare major versions', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions', () => {
      expect(compareVersions('1.2.0', '1.1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should compare patch versions', () => {
      expect(compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('should handle versions with different lengths', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.1', '1.0')).toBeGreaterThan(0);
      expect(compareVersions('1.0', '1.0.1')).toBeLessThan(0);
    });
  });
});
