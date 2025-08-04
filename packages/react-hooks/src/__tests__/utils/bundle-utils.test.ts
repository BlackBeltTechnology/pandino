import type { Bundle, OSGiFramework } from '@pandino/pandino';
import { describe, expect, it, vi } from 'vitest';
import { findBundleBySymbolicName } from '~/utils/bundle-utils';

describe('bundle-utils', () => {
  describe('findBundleBySymbolicName', () => {
    it('should find bundle by symbolic name', () => {
      // Mock bundles
      const mockBundle1: Bundle = {
        getBundleId: vi.fn().mockReturnValue(1),
        getSymbolicName: vi.fn().mockReturnValue('bundle1'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getState: vi.fn().mockReturnValue(32), // ACTIVE
        getHeaders: vi.fn().mockReturnValue({}),
        getLocation: vi.fn().mockReturnValue('location1'),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        uninstall: vi.fn().mockResolvedValue(undefined),
        getRegisteredServices: vi.fn().mockReturnValue([]),
        getServicesInUse: vi.fn().mockReturnValue([]),
        getContext: vi.fn(),
        getBundleModule: vi.fn(),
        getResource: vi.fn(),
        findResources: vi.fn(),
      };

      const mockBundle2: Bundle = {
        getBundleId: vi.fn().mockReturnValue(2),
        getSymbolicName: vi.fn().mockReturnValue('bundle2'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getState: vi.fn().mockReturnValue(32), // ACTIVE
        getHeaders: vi.fn().mockReturnValue({}),
        getLocation: vi.fn().mockReturnValue('location2'),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        uninstall: vi.fn().mockResolvedValue(undefined),
        getRegisteredServices: vi.fn().mockReturnValue([]),
        getServicesInUse: vi.fn().mockReturnValue([]),
        getContext: vi.fn(),
        getBundleModule: vi.fn(),
        getResource: vi.fn(),
        findResources: vi.fn(),
      };

      // Mock framework
      const mockFramework = {
        getBundles: vi.fn().mockReturnValue([mockBundle1, mockBundle2]),
      } as unknown as OSGiFramework;

      // Find bundle by symbolic name
      const result = findBundleBySymbolicName(mockFramework, 'bundle2');

      // Verify that the correct bundle is returned
      expect(result).toBe(mockBundle2);
      expect(mockFramework.getBundles).toHaveBeenCalled();
      expect(mockBundle1.getSymbolicName).toHaveBeenCalled();
      expect(mockBundle2.getSymbolicName).toHaveBeenCalled();
    });

    it('should return null when bundle is not found', () => {
      // Mock bundles
      const mockBundle1: Bundle = {
        getBundleId: vi.fn().mockReturnValue(1),
        getSymbolicName: vi.fn().mockReturnValue('bundle1'),
        getVersion: vi.fn().mockReturnValue('1.0.0'),
        getState: vi.fn().mockReturnValue(32), // ACTIVE
        getHeaders: vi.fn().mockReturnValue({}),
        getLocation: vi.fn().mockReturnValue('location1'),
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        uninstall: vi.fn().mockResolvedValue(undefined),
        getRegisteredServices: vi.fn().mockReturnValue([]),
        getServicesInUse: vi.fn().mockReturnValue([]),
        getContext: vi.fn(),
        getBundleModule: vi.fn(),
        getResource: vi.fn(),
        findResources: vi.fn(),
      };

      // Mock framework
      const mockFramework = {
        getBundles: vi.fn().mockReturnValue([mockBundle1]),
      } as unknown as OSGiFramework;

      // Find bundle by symbolic name
      const result = findBundleBySymbolicName(mockFramework, 'non-existent-bundle');

      // Verify that null is returned
      expect(result).toBeNull();
      expect(mockFramework.getBundles).toHaveBeenCalled();
      expect(mockBundle1.getSymbolicName).toHaveBeenCalled();
    });

    it('should return null when bundles array is empty', () => {
      // Mock framework
      const mockFramework = {
        getBundles: vi.fn().mockReturnValue([]),
      } as unknown as OSGiFramework;

      // Find bundle by symbolic name
      const result = findBundleBySymbolicName(mockFramework, 'bundle1');

      // Verify that null is returned
      expect(result).toBeNull();
      expect(mockFramework.getBundles).toHaveBeenCalled();
    });
  });
});
