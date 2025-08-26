import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceMapProcessor } from '../resource-map-processor';
import type { Bundle } from '../../../framework/interfaces';

describe('ResourceMapProcessor', () => {
  let processor: ResourceMapProcessor;

  beforeEach(() => {
    processor = new ResourceMapProcessor();
  });

  it('should return the correct resource type', () => {
    expect(processor.getResourceType()).toBe('resources');
  });

  it('should return false if host or fragment module is not available', () => {
    const host = {
      getBundleModule: () => null,
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => null,
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(false);
  });

  it('should return false if fragment has no resources', () => {
    const host = {
      getBundleModule: () => ({
        default: {
          resources: {},
        },
      }),
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => ({
        default: {},
      }),
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(false);
  });

  it('should merge fragment resources with host resources', () => {
    const hostResources = {
      'assets/base.css': '/dist/base-styles.a1b2c3.css',
      'i18n/en.json': '/dist/translations/english.d4e5f6.json',
    };

    const fragmentResources = {
      'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
      'i18n/de.json': '/dist/translations/german.j0k1l2.json',
    };

    const hostModule = {
      default: {
        resources: hostResources,
      },
    };

    const fragmentModule = {
      default: {
        resources: fragmentResources,
      },
    };

    const host = {
      getBundleModule: () => hostModule,
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => fragmentModule,
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(true);

    // Check that resources were merged
    expect(hostModule.default.resources).toEqual({
      'assets/base.css': '/dist/base-styles.a1b2c3.css',
      'i18n/en.json': '/dist/translations/english.d4e5f6.json',
      'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
      'i18n/de.json': '/dist/translations/german.j0k1l2.json',
    });
  });

  it('should create resources object in host if it does not exist', () => {
    const fragmentResources = {
      'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
      'i18n/de.json': '/dist/translations/german.j0k1l2.json',
    };

    const hostModule = {
      default: {} as { resources?: Record<string, string> },
    };

    const fragmentModule = {
      default: {
        resources: fragmentResources,
      },
    };

    const host = {
      getBundleModule: () => hostModule,
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => fragmentModule,
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(true);
    expect(hostModule.default.resources).toBeDefined();
    expect(hostModule.default.resources).toEqual(fragmentResources);
  });

  it('should handle fragment resources overriding host resources', () => {
    const hostResources = {
      'assets/theme.css': '/dist/light-theme.a1b2c3.css',
      'i18n/en.json': '/dist/translations/english.d4e5f6.json',
    };

    const fragmentResources = {
      'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
      'i18n/de.json': '/dist/translations/german.j0k1l2.json',
    };

    const hostModule = {
      default: {
        resources: hostResources,
      },
    };

    const fragmentModule = {
      default: {
        resources: fragmentResources,
      },
    };

    const host = {
      getBundleModule: () => hostModule,
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => fragmentModule,
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(true);

    // Check that fragment resources override host resources
    expect(hostModule.default.resources).toEqual({
      'assets/theme.css': '/dist/dark-theme.g7h8i9.css',
      'i18n/en.json': '/dist/translations/english.d4e5f6.json',
      'i18n/de.json': '/dist/translations/german.j0k1l2.json',
    });
  });
});
