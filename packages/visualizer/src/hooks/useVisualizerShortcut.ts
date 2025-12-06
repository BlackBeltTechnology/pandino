import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS } from '../constants';

/**
 * Custom hook for keyboard shortcut to toggle visualizer
 */
export function useVisualizerShortcut(onToggle: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = KEYBOARD_SHORTCUTS.TOGGLE_VISUALIZER;

      if (
        e.ctrlKey === shortcut.ctrl &&
        e.shiftKey === shortcut.shift &&
        e.key === shortcut.key
      ) {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);
}

