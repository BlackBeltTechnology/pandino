import { describe, expect, it } from 'vitest';
import type { BundleManifest, BundleMetadata } from '~/types/bundle-metadata';

describe('Bundle Metadata Types', () => {
  describe('BundleMetadata', () => {
    it('should accept valid bundle metadata', () => {
      const metadata: BundleMetadata = {
        bundleSymbolicName: 'com.example.test',
        bundleVersion: '1.0.0',
        bundleActivator: 'com.example.TestActivator',
        importPackage: 'org.osgi.framework;version="[1.8,2)"',
        exportPackage: 'com.example.api;version="1.0"',
        requireBundle: 'com.example.core;bundle-version="[1.0,2)"',
      };

      expect(metadata.bundleSymbolicName).toBe('com.example.test');
      expect(metadata.bundleVersion).toBe('1.0.0');
    });
  });

  describe('BundleManifest', () => {
    it('should contain headers and metadata', () => {
      const manifest: BundleManifest = {
        headers: {
          'Bundle-SymbolicName': 'com.example.test',
          'Bundle-Version': '1.0.0',
        },
        metadata: {
          bundleSymbolicName: 'com.example.test',
          bundleVersion: '1.0.0',
        },
      };

      expect(manifest.headers).toBeDefined();
      expect(manifest.metadata).toBeDefined();
    });
  });
});
