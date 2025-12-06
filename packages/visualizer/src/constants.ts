/**
 * Constants for the Pandino Visualizer
 */

// Layout configuration
export const LAYOUT_CONFIG = {
  NODE_WIDTH: 220,
  NODE_HEIGHT: 150,
  RANK_SEP: 100,
  NODE_SEP: 80,
} as const;

// Edge styling
export const EDGE_STYLES = {
  CONTAINMENT: {
    stroke: '#4a4a4a',
    strokeWidth: 1.5,
    opacity: 0.5,
  },
  WORKING_REFERENCE: {
    stroke: '#b0b0b0',
    strokeWidth: 1,
    opacity: 0.4,
  },
  BROKEN_MANDATORY: {
    stroke: '#f44336',
    strokeWidth: 4,
  },
  BROKEN_OPTIONAL: {
    stroke: '#ff9800',
    strokeWidth: 4,
  },
  FACTORY_CREATED: {
    stroke: '#9c27b0',
    strokeWidth: 2,
    opacity: 0.6,
  },
} as const;

// Node colors
export const NODE_COLORS = {
  BUNDLE_ACTIVE: '#4caf50',
  BUNDLE_RESOLVED: '#2196f3',
  BUNDLE_OTHER: '#ff9800',
  SERVICE: '#9c27b0',
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_VISUALIZER: {
    ctrl: true,
    shift: true,
    key: 'V',
  },
} as const;

// Event limits
export const EVENT_LOG_MAX_ENTRIES = 100;

