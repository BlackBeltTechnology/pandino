/** Numeric constants for bundle lifecycle states. */
export const BUNDLE_STATES = {
  INSTALLED: 2,
  RESOLVED: 4,
  STARTING: 8,
  ACTIVE: 32,
  STOPPING: 16,
  UNINSTALLED: 1,
} as const;

/** Numeric constants for service event types. */
export const SERVICE_EVENT_TYPES = {
  REGISTERED: 1,
  MODIFIED: 2,
  UNREGISTERING: 4,
  MODIFIED_ENDMATCH: 8,
} as const;

/**
 * Numeric constants for bundle event types. Most event types reuse the
 * {@link BUNDLE_STATES} value that the bundle transitions into; `UPDATED` has
 * no corresponding state, so it gets its own distinct value.
 */
export const BUNDLE_EVENT_TYPES = {
  UPDATED: 64,
} as const;

export const FRAMEWORK_EVENT_TYPES = {
  STARTED: 1,
  ERROR: 2,
  PACKAGES_REFRESHED: 4,
  STARTLEVEL_CHANGED: 8,
  WARNING: 16,
  INFO: 32,
} as const;

export type BundleState = (typeof BUNDLE_STATES)[keyof typeof BUNDLE_STATES];
export type ServiceEventType = (typeof SERVICE_EVENT_TYPES)[keyof typeof SERVICE_EVENT_TYPES];
export type FrameworkEventType = (typeof FRAMEWORK_EVENT_TYPES)[keyof typeof FRAMEWORK_EVENT_TYPES];
