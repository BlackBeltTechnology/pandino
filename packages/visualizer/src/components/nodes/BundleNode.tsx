import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { Bundle } from '@pandino/pandino';

export interface BundleNodeData {
  bundle: Bundle;
  label: string;
  version: string;
  state: string;
  id: number;
}

export const BundleNode = memo(({ data }: NodeProps<BundleNodeData>) => {
  const { label, version, state, id } = data;

  const stateClass = state.toLowerCase();

  return (
    <div className={`custom-node bundle-node bundle-${stateClass}`}>
      <Handle type="target" position={Position.Top} />

      <div className="node-header">
        <div className="node-icon">📦</div>
        <div className="node-title">{label}</div>
      </div>

      <div className="node-body">
        <div className="node-field">
          <span className="node-label">ID:</span>
          <span className="node-value">{id}</span>
        </div>
        <div className="node-field">
          <span className="node-label">Version:</span>
          <span className="node-value">{version}</span>
        </div>
        <div className="node-field">
          <span className={`node-badge badge-${stateClass}`}>{state}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

BundleNode.displayName = 'BundleNode';

