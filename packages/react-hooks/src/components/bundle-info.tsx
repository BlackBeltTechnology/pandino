import { BUNDLE_STATES } from '@pandino/pandino';
import type { ReactNode } from 'react';
import { useBundle } from '../hooks';

export interface BundleInfoProps {
  bundleIdOrName: number | string;
  children?: (props: {
    bundle: any;
    loading: boolean;
    error: Error | null;
    stateToString: (state: number) => string;
  }) => ReactNode;
}

export function bundleStateToString(state: number): string {
  switch (state) {
    case BUNDLE_STATES.INSTALLED:
      return 'INSTALLED';
    case BUNDLE_STATES.RESOLVED:
      return 'RESOLVED';
    case BUNDLE_STATES.STARTING:
      return 'STARTING';
    case BUNDLE_STATES.ACTIVE:
      return 'ACTIVE';
    case BUNDLE_STATES.STOPPING:
      return 'STOPPING';
    case BUNDLE_STATES.UNINSTALLED:
      return 'UNINSTALLED';
    default:
      return `UNKNOWN (${state})`;
  }
}

export function BundleInfo({ bundleIdOrName, children }: BundleInfoProps): ReactNode {
  const { bundle, loading, error } = useBundle(bundleIdOrName);

  if (!children) {
    if (loading) return <div>Loading bundle information...</div>;
    if (error) return <div>Error loading bundle: {error.message}</div>;
    if (!bundle) return <div>Bundle not found</div>;

    return (
      <div className="pandino-bundle-info">
        <h3>Bundle Information</h3>
        <table>
          <tbody>
            <tr>
              <td>ID:</td>
              <td>{bundle.getBundleId()}</td>
            </tr>
            <tr>
              <td>Symbolic Name:</td>
              <td>{bundle.getSymbolicName()}</td>
            </tr>
            <tr>
              <td>Version:</td>
              <td>{bundle.getVersion()}</td>
            </tr>
            <tr>
              <td>State:</td>
              <td>{bundleStateToString(bundle.getState())}</td>
            </tr>
            <tr>
              <td>Location:</td>
              <td>{bundle.getLocation()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return <>{children({ bundle, loading, error, stateToString: bundleStateToString })}</>;
}
