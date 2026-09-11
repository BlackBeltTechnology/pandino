import { vi } from 'vitest';

/** The service interface both ServiceTracker suites track. */
export interface MockService {
  getValue(): string;
}

/** A `MockService` service reference stub carrying an id and a ranking. */
export const makeServiceRef = (id: number, ranking = 0) => ({
  getProperty: vi.fn((key: string) => {
    if (key === 'service.id') return id;
    if (key === 'service.ranking') return ranking;
    if (key === 'objectClass') return 'MockService';
    return null;
  }),
  getPropertyKeys: vi.fn(() => ['service.id', 'service.ranking', 'objectClass']),
  getBundle: vi.fn(),
  isAssignableTo: vi.fn(),
  getProperties: vi.fn(() => ({ 'service.id': id, 'service.ranking': ranking, objectClass: 'MockService' })),
});

/** A service event stub of `type` carrying `reference`. */
export const makeServiceEvent = (type: number, reference: any) => ({
  getType: vi.fn(() => type),
  getServiceReference: vi.fn(() => reference),
});

/**
 * A bundle context stub for tracker tests: `services` maps a reference to the
 * object `getService` resolves, and the filter matches `MockService` only.
 */
export const createTrackerContext = (services: Map<any, MockService>): any => ({
  addServiceListener: vi.fn(),
  removeServiceListener: vi.fn(),
  getServiceReferences: vi.fn(() => []),
  getService: vi.fn((ref: any) => services.get(ref) ?? null),
  ungetService: vi.fn(),
  createFilter: vi.fn((filter: string) => ({
    match: (props: any) => props.objectClass === 'MockService',
    toString: () => filter,
  })),
});
