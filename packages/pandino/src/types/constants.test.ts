import { describe, expect, it } from 'vitest';
import { BUNDLE_STATES, FRAMEWORK_EVENT_TYPES, SERVICE_EVENT_TYPES } from './constants';

describe('Constants', () => {
  describe('BUNDLE_STATES', () => {
    it('should have all required bundle states', () => {
      expect(BUNDLE_STATES.UNINSTALLED).toBe(1);
      expect(BUNDLE_STATES.INSTALLED).toBe(2);
      expect(BUNDLE_STATES.RESOLVED).toBe(4);
      expect(BUNDLE_STATES.STARTING).toBe(8);
      expect(BUNDLE_STATES.STOPPING).toBe(16);
      expect(BUNDLE_STATES.ACTIVE).toBe(32);
    });

    it('should have unique values for each state', () => {
      const values = Object.values(BUNDLE_STATES);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('SERVICE_EVENT_TYPES', () => {
    it('should have all required service event types', () => {
      expect(SERVICE_EVENT_TYPES.REGISTERED).toBe(1);
      expect(SERVICE_EVENT_TYPES.MODIFIED).toBe(2);
      expect(SERVICE_EVENT_TYPES.UNREGISTERING).toBe(4);
      expect(SERVICE_EVENT_TYPES.MODIFIED_ENDMATCH).toBe(8);
    });
  });

  describe('FRAMEWORK_EVENT_TYPES', () => {
    it('should have all required framework event types', () => {
      expect(FRAMEWORK_EVENT_TYPES.STARTED).toBe(1);
      expect(FRAMEWORK_EVENT_TYPES.ERROR).toBe(2);
      expect(FRAMEWORK_EVENT_TYPES.WARNING).toBe(16);
      expect(FRAMEWORK_EVENT_TYPES.INFO).toBe(32);
    });
  });
});
