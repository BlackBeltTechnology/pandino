import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServiceTrackerCustomizer } from '../interfaces';
import { SERVICE_EVENT_TYPES } from '../../../types/constants';
import { ServiceTracker } from '../index';
import { type MockService, makeServiceEvent, makeServiceRef } from './support/tracker-mocks';

class MockServiceImpl implements MockService {
  constructor(private value: string) {}
  getValue(): string {
    return this.value;
  }
}

describe('ServiceTracker', () => {
  const mockBundleContext = {
    addServiceListener: vi.fn(),
    removeServiceListener: vi.fn(),
    getServiceReferences: vi.fn(),
    getService: vi.fn(),
    ungetService: vi.fn(),
    createFilter: vi.fn((filter) => ({
      match: vi.fn((props) => {
        if (filter === '(objectClass=MockService)') {
          return props.objectClass === 'MockService';
        }
        return true;
      }),
      toString: () => filter,
    })),
  };

  let serviceTracker: ServiceTracker<MockService>;
  let mockServiceReference1: any;
  let mockServiceReference2: any;
  let mockService1: MockService;
  let mockService2: MockService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServiceReference1 = makeServiceRef(1, 10);
    mockServiceReference2 = makeServiceRef(2, 20);
    mockService1 = new MockServiceImpl('service1');
    mockService2 = new MockServiceImpl('service2');

    mockBundleContext.getServiceReferences.mockReturnValue([mockServiceReference1, mockServiceReference2]);

    mockBundleContext.getService.mockImplementation((ref) => {
      if (ref === mockServiceReference1) return mockService1;
      if (ref === mockServiceReference2) return mockService2;
      return null;
    });

    serviceTracker = new ServiceTracker<MockService>(mockBundleContext as any, 'MockService');
  });

  afterEach(() => {
    serviceTracker.close();
  });

  describe('constructor', () => {
    it('should create a ServiceTracker with a class name', () => {
      const tracker = new ServiceTracker<MockService>(mockBundleContext as any, 'MockService');
      expect(tracker).toBeDefined();
      expect(mockBundleContext.createFilter).toHaveBeenCalledWith('(objectClass=MockService)');
    });

    it('should create a ServiceTracker with a service reference', () => {
      const tracker = new ServiceTracker<MockService>(mockBundleContext as any, mockServiceReference1 as any);
      expect(tracker).toBeDefined();
      expect(mockBundleContext.createFilter).toHaveBeenCalled();
    });

    it('should create a ServiceTracker with a filter', () => {
      const mockFilter = {
        match: vi.fn(),
        toString: vi.fn(),
      };
      const tracker = new ServiceTracker<MockService>(mockBundleContext as any, mockFilter as any);
      expect(tracker).toBeDefined();
    });

    it('should create a ServiceTracker with a customizer', () => {
      const customizer: ServiceTrackerCustomizer<MockService, string> = {
        addingService: vi.fn((_ref, service) => service.getValue()),
        modifiedService: vi.fn(),
        removedService: vi.fn(),
      };

      const tracker = new ServiceTracker<MockService, string>(mockBundleContext as any, 'MockService', customizer);

      expect(tracker).toBeDefined();
    });
  });

  describe('open', () => {
    it('should add a service listener and track initial services', () => {
      serviceTracker.open();

      expect(mockBundleContext.addServiceListener).toHaveBeenCalled();
      expect(mockBundleContext.getServiceReferences).toHaveBeenCalledWith('MockService', '(objectClass=MockService)');
      expect(mockBundleContext.getService).toHaveBeenCalledWith(mockServiceReference1);
      expect(mockBundleContext.getService).toHaveBeenCalledWith(mockServiceReference2);

      // Should track both services
      expect(serviceTracker.size()).toBe(2);
    });

    it('should not track services twice if opened multiple times', () => {
      serviceTracker.open();
      serviceTracker.open(); // Second open should be a no-op

      expect(mockBundleContext.addServiceListener).toHaveBeenCalledTimes(1);
      expect(serviceTracker.size()).toBe(2);
    });

    it('should use customizer to transform services', () => {
      const customizer: ServiceTrackerCustomizer<MockService, string> = {
        addingService: vi.fn((_ref, service) => service.getValue()),
        modifiedService: vi.fn(),
        removedService: vi.fn(),
      };

      const tracker = new ServiceTracker<MockService, string>(mockBundleContext as any, 'MockService', customizer);

      tracker.open();

      expect(customizer.addingService).toHaveBeenCalledWith(mockServiceReference1, mockService1);
      expect(customizer.addingService).toHaveBeenCalledWith(mockServiceReference2, mockService2);
    });

    it('should not track services that the customizer rejects', () => {
      const customizer: ServiceTrackerCustomizer<MockService, string> = {
        addingService: vi.fn((_ref, service) => {
          // Only track service2
          return service === mockService2 ? service.getValue() : null;
        }),
        modifiedService: vi.fn(),
        removedService: vi.fn(),
      };

      const tracker = new ServiceTracker<MockService, string>(mockBundleContext as any, 'MockService', customizer);

      tracker.open();

      expect(tracker.size()).toBe(1);
      expect(mockBundleContext.ungetService).toHaveBeenCalledWith(mockServiceReference1);
    });
  });

  describe('close', () => {
    it('should remove the service listener and untrack all services', () => {
      serviceTracker.open();
      expect(serviceTracker.size()).toBe(2);

      serviceTracker.close();

      expect(mockBundleContext.removeServiceListener).toHaveBeenCalled();
      expect(serviceTracker.size()).toBe(0);
      expect(mockBundleContext.ungetService).toHaveBeenCalledWith(mockServiceReference1);
      expect(mockBundleContext.ungetService).toHaveBeenCalledWith(mockServiceReference2);
    });

    it('should do nothing if not open', () => {
      serviceTracker.close(); // Not opened yet

      expect(mockBundleContext.removeServiceListener).not.toHaveBeenCalled();
    });

    it('should call removedService on the customizer for each tracked service', () => {
      const customizer: ServiceTrackerCustomizer<MockService, string> = {
        addingService: vi.fn((_ref, service) => service.getValue()),
        modifiedService: vi.fn(),
        removedService: vi.fn(),
      };

      const tracker = new ServiceTracker<MockService, string>(mockBundleContext as any, 'MockService', customizer);

      tracker.open();
      tracker.close();

      expect(customizer.removedService).toHaveBeenCalledWith(
        mockServiceReference1,
        mockService1,
        mockService1.getValue(),
      );
      expect(customizer.removedService).toHaveBeenCalledWith(
        mockServiceReference2,
        mockService2,
        mockService2.getValue(),
      );
    });
  });

  describe('getService', () => {
    it('should return the highest ranking service', () => {
      serviceTracker.open();

      const service = serviceTracker.getService();

      // mockService2 has higher ranking (20 vs 10)
      expect(service).toBe(mockService2);
    });

    it('should return null if no services are tracked', () => {
      // Don't open the tracker, so no services are tracked
      const service = serviceTracker.getService();

      expect(service).toBeNull();
    });

    it('should return the service for a specific reference', () => {
      serviceTracker.open();

      const service = serviceTracker.getService(mockServiceReference1 as any);

      expect(service).toBe(mockService1);
    });

    it('should return null for an untracked reference', () => {
      serviceTracker.open();

      const untracked = makeServiceRef(3);
      const service = serviceTracker.getService(untracked as any);

      expect(service).toBeNull();
    });
  });

  describe('getServices', () => {
    it('should return all tracked services', () => {
      serviceTracker.open();

      const services = serviceTracker.getServices();

      expect(services).toHaveLength(2);
      expect(services).toContain(mockService1);
      expect(services).toContain(mockService2);
    });

    it('should return an empty array if no services are tracked', () => {
      // Don't open the tracker, so no services are tracked
      const services = serviceTracker.getServices();

      expect(services).toEqual([]);
    });
  });

  describe('getServiceReferences', () => {
    it('should return all tracked service references sorted by ranking', () => {
      serviceTracker.open();

      const references = serviceTracker.getServiceReferences();

      expect(references).toHaveLength(2);
      // First reference should be the one with higher ranking
      expect(references![0]).toBe(mockServiceReference2);
      expect(references![1]).toBe(mockServiceReference1);
    });

    it('should return null if no services are tracked', () => {
      // Don't open the tracker, so no services are tracked
      const references = serviceTracker.getServiceReferences();

      expect(references).toBeNull();
    });

    it('should sort by service ID when rankings are equal', () => {
      // Create references with the same ranking but different IDs
      const ref1 = makeServiceRef(1, 10);
      const ref2 = makeServiceRef(2, 10);

      mockBundleContext.getServiceReferences.mockReturnValue([ref2, ref1]);
      // Mock getService to return a service for each reference
      mockBundleContext.getService.mockImplementation((ref) => {
        if (ref === ref1) return mockService1;
        if (ref === ref2) return mockService2;
        return null;
      });

      serviceTracker.open();

      const references = serviceTracker.getServiceReferences();

      // Should be sorted by ID (lowest first) when rankings are equal
      expect(references![0]).toBe(ref1);
      expect(references![1]).toBe(ref2);
    });
  });

  describe('serviceChanged', () => {
    it('should track a newly registered service', () => {
      serviceTracker.open();

      // Clear the tracked services (simulate starting with no services)
      serviceTracker.close();
      mockBundleContext.getServiceReferences.mockReturnValue([]);
      serviceTracker.open();
      expect(serviceTracker.size()).toBe(0);

      // Simulate a service registration event
      const event = makeServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, mockServiceReference1);

      serviceTracker.serviceChanged(event as any);

      expect(serviceTracker.size()).toBe(1);
      expect(serviceTracker.getService()).toBe(mockService1);
    });

    it('should update a modified service', () => {
      serviceTracker.open();

      // Simulate a service modification event
      const event = makeServiceEvent(SERVICE_EVENT_TYPES.MODIFIED, mockServiceReference1);

      // Create a spy to check if modifiedService is called
      const modifiedSpy = vi.spyOn(serviceTracker, 'modifiedService');

      serviceTracker.serviceChanged(event as any);

      expect(modifiedSpy).toHaveBeenCalledWith(mockServiceReference1, mockService1, mockService1);
    });

    it('should untrack an unregistering service', () => {
      serviceTracker.open();

      // Simulate a service unregistration event
      const event = makeServiceEvent(SERVICE_EVENT_TYPES.UNREGISTERING, mockServiceReference1);

      serviceTracker.serviceChanged(event as any);

      // Should have one less service
      expect(serviceTracker.size()).toBe(1);
      // The remaining service should be mockService2
      expect(serviceTracker.getService()).toBe(mockService2);
    });

    it("should ignore events for services that don't match the filter", () => {
      // Create a tracker with a specific filter
      const tracker = new ServiceTracker<MockService>(
        mockBundleContext as any,
        'OtherService', // Different service type
      );

      // Ensure no services are tracked initially
      mockBundleContext.getServiceReferences.mockReturnValue([]);

      tracker.open();

      const mockFilter = {
        match: vi.fn().mockReturnValue(false),
        toString: vi.fn(),
      };
      (tracker as any).filter = mockFilter;

      const event = makeServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, mockServiceReference1);

      tracker.serviceChanged(event as any);

      // Should not track the service
      expect(tracker.size()).toBe(0);
    });

    it('should ignore events when the tracker is closed', () => {
      serviceTracker.open();
      serviceTracker.close();

      const event = makeServiceEvent(SERVICE_EVENT_TYPES.REGISTERED, mockServiceReference1);

      serviceTracker.serviceChanged(event as any);

      // Should not track the service
      expect(serviceTracker.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return the number of tracked services', () => {
      expect(serviceTracker.size()).toBe(0);

      serviceTracker.open();
      expect(serviceTracker.size()).toBe(2);

      const event = makeServiceEvent(SERVICE_EVENT_TYPES.UNREGISTERING, mockServiceReference1);
      serviceTracker.serviceChanged(event as any);

      expect(serviceTracker.size()).toBe(1);
    });
  });
});
