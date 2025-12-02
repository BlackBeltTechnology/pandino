import { memo, ReactNode } from 'react';

export interface Statistics {
  totalBundles: number;
  activeBundles: number;
  totalServices: number;
}

export interface StatisticsPanelProps {
  statistics: Statistics;
  children?: ReactNode;
}

export const StatisticsPanel = memo(({ statistics, children }: StatisticsPanelProps) => {
  return (
    <div className="pandino-statistics">
      <div className="stat-card">
        <div className="stat-value">{statistics.totalBundles}</div>
        <div className="stat-label">Total Bundles</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{statistics.activeBundles}</div>
        <div className="stat-label">Active Bundles</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{statistics.totalServices}</div>
        <div className="stat-label">Services</div>
      </div>
      {children && (
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {children}
        </div>
      )}
    </div>
  );
});

StatisticsPanel.displayName = 'StatisticsPanel';

