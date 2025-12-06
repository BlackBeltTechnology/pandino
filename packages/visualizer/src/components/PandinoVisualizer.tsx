import { useCallback, useState, type ReactNode } from 'react';
import type { OSGiFramework } from '@pandino/pandino';
import { GraphView } from './GraphView';
import { StatisticsPanel } from './StatisticsPanel';
import { useFrameworkGraph, useFrameworkStatistics, useVisualizerShortcut } from '../hooks';
import './PandinoVisualizer.css';

export interface PandinoVisualizerProps {
  framework: OSGiFramework;
  defaultOpen?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'fullscreen';
  children?: ReactNode;
}

export function PandinoVisualizer({
  framework,
  defaultOpen = false,
  position = 'fullscreen',
  children,
}: PandinoVisualizerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Use custom hooks for data management
  const { nodes, edges } = useFrameworkGraph(framework);
  const statistics = useFrameworkStatistics(framework, nodes);

  // Toggle handler
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Keyboard shortcut
  useVisualizerShortcut(handleToggle);

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className="pandino-visualizer-toggle"
        title="Open Pandino Visualizer (Ctrl+Shift+V)"
      >
        🔍
      </button>
    );
  }

  const containerClass =
    position === 'fullscreen'
      ? 'pandino-visualizer-fullscreen'
      : `pandino-visualizer-panel pandino-visualizer-${position}`;

  return (
    <div className={containerClass}>
      <div className="pandino-visualizer-header">
        <h2>🔍 Pandino Visualizer</h2>

        <StatisticsPanel statistics={statistics}>{children}</StatisticsPanel>

        <div className="pandino-visualizer-controls">
          <button onClick={handleToggle} className="pandino-visualizer-close">
            ×
          </button>
        </div>
      </div>

      <GraphView nodes={nodes} edges={edges} />
    </div>
  );
}

