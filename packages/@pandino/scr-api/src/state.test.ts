import { describe, expect, it, vi } from 'vitest';
import type { BundleContext, ServiceReference } from '@pandino/pandino-api';
import { registerDecoratorHandler } from './state';
import { COMPONENT_REGISTRAR_INTERFACE_KEY } from './constants';
import type { ComponentRegistrar } from './interfaces';
import { Guest, Host } from './__fixtures__/hostAndGuest';

describe('Decorator registration', () => {
  const mockGetServiceReference = vi.fn().mockImplementation((identifier: string): ServiceReference<any> | undefined => {
    if (identifier === COMPONENT_REGISTRAR_INTERFACE_KEY) {
      return mockRegistrarServiceReference;
    }
    return undefined;
  });
  const mockGetService = vi.fn().mockImplementation((reference: ServiceReference<any>): any | undefined => {
    if (mockRegistrarServiceReference && reference === mockRegistrarServiceReference) {
      return mockRegistrar;
    }
    return undefined;
  });
  const mockUngetService = vi.fn().mockImplementation((reference: ServiceReference<any>): boolean => {
    return true;
  });
  const mockRegisterComponent = vi.fn().mockImplementation((target: any, bundleContext: BundleContext) => {
    return undefined;
  });

  const mockRegistrar: ComponentRegistrar = {
    registerComponent: mockRegisterComponent,
  };
  const mockRegistrarServiceReference: ServiceReference<ComponentRegistrar> = {} as unknown as ServiceReference<ComponentRegistrar>;

  describe('lifecycle', () => {
    let deregisterCallback: () => void;
    let mockContext: Partial<BundleContext>;

    it('registration is not called until the handler is initialized', () => {
      expect(mockRegisterComponent).toHaveBeenCalledTimes(0);
    });

    it('handler initialization', () => {
      mockContext = {
        getServiceReference: mockGetServiceReference,
        getService: mockGetService,
        ungetService: mockUngetService,
      };
      deregisterCallback = registerDecoratorHandler(mockContext as BundleContext);

      // expect(() => {
      //   registerDecoratorHandler(mockContext as BundleContext);
      // }).toThrow('Decorator handler already initialized!');

      expect(mockGetServiceReference).toHaveBeenCalledTimes(1);
      expect(mockGetServiceReference).toHaveBeenCalledWith(COMPONENT_REGISTRAR_INTERFACE_KEY);
      expect(mockGetService).toHaveBeenCalledTimes(1);
      expect(mockGetService).toHaveBeenCalledWith(mockRegistrarServiceReference);
    });

    it('components are registered', () => {
      expect(mockRegisterComponent).toHaveBeenCalledTimes(2);
      expect(mockRegisterComponent).toHaveBeenCalledWith(Guest, mockContext);
      expect(mockRegisterComponent).toHaveBeenCalledWith(Host, mockContext);
    });

    it('clean up references emulating bundle de-activation', () => {
      expect(typeof deregisterCallback).toEqual('function');

      deregisterCallback();

      expect(mockUngetService).toHaveBeenCalledTimes(1);
      expect(mockUngetService).toHaveBeenCalledWith(mockRegistrarServiceReference);
    });
  });
});
