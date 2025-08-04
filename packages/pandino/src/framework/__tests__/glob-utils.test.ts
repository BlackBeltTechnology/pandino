import { describe, it, expect } from 'vitest';
import { globToRegExp, matchesGlob, filterByGlob } from '../glob-utils';

describe('Glob Utilities', () => {
  describe('globToRegExp', () => {
    it('should convert a simple glob pattern to a RegExp', () => {
      const regex = globToRegExp('assets', '*.css');
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.test('assets/style.css')).toBe(true);
      expect(regex.test('assets/theme.css')).toBe(true);
      expect(regex.test('assets/script.js')).toBe(false);
    });

    it('should normalize the base path with a trailing slash', () => {
      const regex1 = globToRegExp('assets/', '*.css');
      const regex2 = globToRegExp('assets', '*.css');

      expect(regex1.test('assets/style.css')).toBe(regex2.test('assets/style.css'));
    });

    it('should handle file patterns with dots', () => {
      const regex = globToRegExp('assets', 'file.txt');
      expect(regex.test('assets/file.txt')).toBe(true);
      expect(regex.test('assets/filetxt')).toBe(false);
    });

    it('should handle wildcard patterns', () => {
      const regex = globToRegExp('assets', '*.txt');
      expect(regex.test('assets/file.txt')).toBe(true);
      expect(regex.test('assets/notes.txt')).toBe(true);
      expect(regex.test('assets/image.png')).toBe(false);
    });

    it('should handle question mark patterns', () => {
      const regex = globToRegExp('assets', 'file?.txt');
      expect(regex.test('assets/file1.txt')).toBe(true);
      expect(regex.test('assets/file2.txt')).toBe(true);
      expect(regex.test('assets/file10.txt')).toBe(false);
    });

    it('should handle complex patterns', () => {
      const regex = globToRegExp('assets', 'file-*.??t');
      expect(regex.test('assets/file-abc.txt')).toBe(true);
      expect(regex.test('assets/file-123.jst')).toBe(true);
      expect(regex.test('assets/file-xyz.t')).toBe(false);
    });
  });

  describe('matchesGlob', () => {
    it('should match a path against a glob pattern', () => {
      expect(matchesGlob('assets/style.css', 'assets', '*.css')).toBe(true);
      expect(matchesGlob('assets/js/script.js', 'assets', '*.css')).toBe(false);
    });

    it('should only match direct children of the base path', () => {
      expect(matchesGlob('assets/style.css', 'assets', '*.*')).toBe(true);
      expect(matchesGlob('assets/script.js', 'assets', '*.*')).toBe(true);
      expect(matchesGlob('assets/fonts/font.ttf', 'assets', '*.*')).toBe(false);
    });

    it('should match paths with question marks', () => {
      expect(matchesGlob('assets/file1.txt', 'assets', 'file?.txt')).toBe(true);
      expect(matchesGlob('assets/file2.txt', 'assets', 'file?.txt')).toBe(true);
      expect(matchesGlob('assets/file10.txt', 'assets', 'file?.txt')).toBe(false);
    });

    it('should match paths with complex patterns', () => {
      expect(matchesGlob('assets/file-abc.txt', 'assets', 'file-*.txt')).toBe(true);
      expect(matchesGlob('assets/file-123.txt', 'assets', 'file-*.txt')).toBe(true);
      expect(matchesGlob('assets/other-file.txt', 'assets', 'file-*.txt')).toBe(false);
    });
  });

  describe('filterByGlob', () => {
    const paths = [
      'assets/style.css',
      'assets/theme.css',
      'assets/script.js',
      'assets/image.png',
      'assets/fonts/font.ttf', // Nested path that should be filtered out
      'i18n/en.json',
      'i18n/de.json',
      'i18n/fr.json',
    ];

    it('should filter paths by extension', () => {
      const filtered = filterByGlob(paths, 'assets', '*.css');
      expect(filtered).toHaveLength(2);
      expect(filtered).toContain('assets/style.css');
      expect(filtered).toContain('assets/theme.css');
    });

    it('should filter paths by directory', () => {
      const filtered = filterByGlob(paths, 'i18n', '*');
      expect(filtered).toHaveLength(3);
      expect(filtered).toContain('i18n/en.json');
      expect(filtered).toContain('i18n/de.json');
      expect(filtered).toContain('i18n/fr.json');
    });

    it('should filter paths by pattern', () => {
      // Use a more specific pattern that only matches 'en.json' and 'de.json'
      // This is a proper glob pattern that matches only specific filenames
      const filtered = filterByGlob(paths, 'i18n', '{en,de}.json');
      expect(filtered).toHaveLength(2);
      expect(filtered).toContain('i18n/en.json');
      expect(filtered).toContain('i18n/de.json');
      expect(filtered).not.toContain('i18n/fr.json');
    });

    it('should return an empty array if no paths match', () => {
      const filtered = filterByGlob(paths, 'nonexistent', '*');
      expect(filtered).toHaveLength(0);
    });
  });
});
