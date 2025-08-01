import React from 'react';
import { usePandinoContext } from '@pandino/react-hooks';
import { BUNDLE_STATES } from '@pandino/pandino';
import './BundleInfo.css';

interface BundleInfoProps {}

const BundleInfo: React.FC<BundleInfoProps> = () => {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Add a bundle listener to detect when bundles are added/removed
  React.useEffect(() => {
    if (!bundleContext) return;

    const bundleListener = {
      bundleChanged: () => {
        setRefreshTrigger((prev) => prev + 1);
      },
    };

    try {
      bundleContext.addBundleListener(bundleListener);
      return () => {
        bundleContext.removeBundleListener(bundleListener);
      };
    } catch (error) {
      console.warn('Failed to add bundle listener:', error);
    }
  }, [bundleContext]);

  const bundles = React.useMemo(() => {
    // Include refreshTrigger and isInitialized in dependencies to force refresh
    if (!bundleContext || !isInitialized) return [];

    try {
      const frameworkBundles = bundleContext.getBundles();

      return frameworkBundles.map((bundle) => {
        const headers = bundle.getHeaders();
        const symbolicName = bundle.getSymbolicName();
        const bundleState = bundle.getState();

        const getStateString = (state: number): string => {
          const stateEntry = Object.entries(BUNDLE_STATES).find(([_, value]) => value === state);
          return stateEntry ? stateEntry[0] : 'UNKNOWN';
        };

        const getBundleType = (name: string) => {
          if (name.includes('framework') || name.includes('pandino')) return 'system';
          if (name.includes('service') || name.includes('scr')) return 'service';
          if (name.includes('library') || name.includes('lib')) return 'library';
          return 'bundle';
        };

        const stateString = getStateString(bundleState);

        const bundleData = {
          id: bundle.getBundleId(),
          symbolicName: symbolicName,
          version: bundle.getVersion(),
          name: headers.bundleName || headers['Bundle-Name'] || symbolicName,
          description: headers.bundleDescription || headers['Bundle-Description'] || 'No description available',
          state: stateString,
          stateNumeric: bundleState,
          type: getBundleType(symbolicName.toLowerCase()),
        };

        return bundleData;
      });
    } catch (error) {
      console.warn('Failed to retrieve bundles from framework:', error);
      return [];
    }
  }, [bundleContext, isInitialized, refreshTrigger]);

  const getStateIcon = (state: number) => {
    switch (state) {
      case BUNDLE_STATES.ACTIVE:
        return '🟢';
      case BUNDLE_STATES.STARTING:
        return '🟡';
      case BUNDLE_STATES.STOPPING:
        return '🟠';
      case BUNDLE_STATES.RESOLVED:
        return '🔵';
      case BUNDLE_STATES.INSTALLED:
        return '🔷';
      case BUNDLE_STATES.UNINSTALLED:
        return '⚫';
      default:
        return '⚫';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return '⚙️';
      case 'service':
        return '🎯';
      case 'library':
        return '📚';
      default:
        return '📦';
    }
  };

  return (
    <div className="bundle-info">
      <div className="bundle-header">
        <h2 className="bundle-title">
          <span className="bundle-icon">📦</span>
          Bundle Registry
        </h2>
        <div className="bundle-subtitle">Active bundles and their metadata</div>
      </div>

      <div className="bundle-grid">
        {bundles.map((bundle) => (
          <div key={bundle.id} className={`bundle-card ${bundle.type}-bundle`}>
            <div className="bundle-card-header">
              <div className="bundle-card-icon">{getTypeIcon(bundle.type)}</div>
              <div className="bundle-card-title">
                <h3>{bundle.name}</h3>
                <div className="bundle-id">Bundle #{bundle.id}</div>
              </div>
              <div className="bundle-state">
                <span className="state-icon">{getStateIcon(bundle.stateNumeric)}</span>
                <span className={`state-badge ${bundle.state.toLowerCase()}`}>{bundle.state}</span>
              </div>
            </div>

            <div className="bundle-card-content">
              <div className="bundle-row">
                <span className="bundle-label">Symbolic Name:</span>
                <span className="bundle-value mono">{bundle.symbolicName}</span>
              </div>
              <div className="bundle-row">
                <span className="bundle-label">Version:</span>
                <span className="bundle-value mono">{bundle.version}</span>
              </div>
              <div className="bundle-row description-row">
                <span className="bundle-label">Description:</span>
                <span className="bundle-value">{bundle.description}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BundleInfo;
