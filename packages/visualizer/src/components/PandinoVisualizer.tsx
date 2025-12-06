import { useCallback, useState, type ReactNode } from 'react';
import type { OSGiFramework } from '@pandino/pandino';
import { GraphView } from './GraphView';
import { StatisticsPanel } from './StatisticsPanel';
import { EventLog } from './EventLog';
import { useFrameworkGraph, useFrameworkStatistics, useVisualizerShortcut } from '../hooks';
import './PandinoVisualizer.css';

export interface PandinoVisualizerProps {
  framework: OSGiFramework;
  defaultOpen?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'fullscreen';
  children?: ReactNode;
}

type ViewType = 'graph' | 'list';

export function PandinoVisualizer({
  framework,
  defaultOpen = false,
  position = 'fullscreen',
  children,
}: PandinoVisualizerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedView, setSelectedView] = useState<ViewType>('graph');

  // Use custom hooks for data management
  const { nodes, edges, events } = useFrameworkGraph(framework);
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
          <button
            onClick={() => setSelectedView('graph')}
            className={selectedView === 'graph' ? 'active' : ''}
          >
            Graph View
          </button>
          <button
            onClick={() => setSelectedView('list')}
            className={selectedView === 'list' ? 'active' : ''}
          >
            List View
          </button>
          <button onClick={handleToggle} className="pandino-visualizer-close">
            ×
          </button>
        </div>
      </div>

      {selectedView === 'graph' ? (
        <GraphView nodes={nodes} edges={edges} />
      ) : (
        <EventLog events={events} framework={framework} />
      )}
    </div>
  );
}

