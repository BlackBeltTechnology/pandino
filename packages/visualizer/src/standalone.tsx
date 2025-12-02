import React from 'react';
import { createRoot } from 'react-dom/client';
import type { OSGiFramework } from '@pandino/pandino';
import { PandinoVisualizer } from './components/PandinoVisualizer';
import { PandinoVisualizerProvider } from './components/PandinoVisualizerProvider';

interface VisualizerOptions {
  framework: OSGiFramework;
  containerId?: string;
  defaultOpen?: boolean;
  position?: 'fullscreen' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class PandinoVisualizerStandalone {
  private root: any = null;
  private container: HTMLElement | null = null;

  /**
   * Initialize and mount the visualizer
   */
  public init(options: VisualizerOptions): void {
    const {
      framework,
      containerId = 'pandino-visualizer-root',
      defaultOpen = false,
      position = 'fullscreen',
    } = options;

    // Create container if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
    this.container = container;

    // Create React root and render
    this.root = createRoot(container);
    this.root.render(
      React.createElement(
        PandinoVisualizerProvider,
        null,
        React.createElement(PandinoVisualizer, {
          framework,
          defaultOpen,
          position,
        })
      )
    );
  }

  /**
   * Unmount the visualizer
   */
  public destroy(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}

// Export as global
const visualizerInstance = new PandinoVisualizerStandalone();

(window as any).PandinoVisualizer = {
  /**
   * Initialize the visualizer with a framework instance
   * @param framework - The Pandino framework instance
   * @param options - Optional configuration
   */
  init: (framework: OSGiFramework, options?: Partial<VisualizerOptions>) => {
    visualizerInstance.init({
      framework,
      containerId: options?.containerId,
      defaultOpen: options?.defaultOpen ?? false,
      position: options?.position ?? 'fullscreen',
    });
  },

  /**
   * Destroy the visualizer and clean up
   */
  destroy: () => {
    visualizerInstance.destroy();
  },
};

// Auto-initialize if framework is available on window
if ((window as any).pandinoFramework) {
  console.log('PandinoVisualizer: Auto-initializing with global framework');
  visualizerInstance.init({
    framework: (window as any).pandinoFramework,
  });
}

console.log('PandinoVisualizer loaded. Press Ctrl+Shift+V to toggle, or call PandinoVisualizer.init(framework)');

