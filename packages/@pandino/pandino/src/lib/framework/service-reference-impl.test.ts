import { describe, beforeEach, expect, it, vi } from 'vitest';
import { ServiceReferenceImpl } from './service-reference-impl';

describe('ServiceReferenceImpl', () => {
  const mockGetProperty = vi.fn();
  let serviceReference: ServiceReferenceImpl;
  let mockServiceRegistrationImpl: any = {
    getProperty: mockGetProperty,
  };
  let mockBundle: any = vi.fn(() => ({}));

  beforeEach(() => {
    mockGetProperty.mockClear();
    serviceReference = new ServiceReferenceImpl(mockServiceRegistrationImpl, mockBundle);
  });

  it('getRevision()', () => {
    expect(() => serviceReference.getRevision()).toThrow();
  });

  it('getNamespace()', () => {
    expect(serviceReference.getNamespace()).toEqual('service-reference');
  });

  it('getDirectives()', () => {
    expect(serviceReference.getDirectives()).toEqual({});
  });

  it('getUses()', () => {
    expect(serviceReference.getUses()).toEqual([]);
  });

  it('hasObjectClass()', () => {
    mockGetProperty.mockReturnValue('some-value');
    expect(serviceReference.hasObjectClass('some-value')).toEqual(true);

    mockGetProperty.mockReturnValue(['some-value', 'some-other-value']);
    expect(serviceReference.hasObjectClass('some-value')).toEqual(true);

    mockGetProperty.mockReturnValue(['some-other-value']);
    expect(serviceReference.hasObjectClass('some-value')).toEqual(false);
  });
});
