import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentResourceProcessor } from '../../component-resource-processor';
import type { Bundle } from '../../../../framework/interfaces';
import { BundleModule } from '../../../../types/bundle-metadata';

describe('ComponentResourceProcessor', () => {
  let processor: ComponentResourceProcessor;

  beforeEach(() => {
    processor = new ComponentResourceProcessor();
  });

  it('should return the correct resource type', () => {
    expect(processor.getResourceType()).toBe('components');
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

  it('should return false if fragment has no components', () => {
    const host = {
      getBundleModule: () => ({
        default: {
          components: [],
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

  it('should merge fragment components with host components', () => {
    const hostComponent = { name: 'hostComponent' };
    const fragmentComponent = { name: 'fragmentComponent' };

    const hostModule = {
      default: {
        components: [hostComponent],
      },
    };

    const fragmentModule = {
      default: {
        components: [fragmentComponent],
      },
    };

    const host = {
      getBundleModule: () => hostModule,
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => fragmentModule,
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(true);
    expect(hostModule.default.components).toHaveLength(2);
    expect(hostModule.default.components[0]).toBe(hostComponent);
    expect(hostModule.default.components[1]).toBe(fragmentComponent);
  });

  it('should create components array in host if it does not exist', () => {
    const fragmentComponent = { name: 'fragmentComponent' };

    const hostModule: BundleModule = {
      default: {} as unknown as any,
    };

    const fragmentModule = {
      default: {
        components: [fragmentComponent],
      },
    };

    const host = {
      getBundleModule: () => hostModule,
    } as unknown as Bundle;

    const fragment = {
      getBundleModule: () => fragmentModule,
    } as unknown as Bundle;

    expect(processor.processResources(host, fragment)).toBe(true);
    expect(hostModule.default.components).toHaveLength(1);
    expect(hostModule.default.components![0]).toBe(fragmentComponent);
  });
});
