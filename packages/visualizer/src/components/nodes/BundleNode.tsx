import { memo, createElement } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { Bundle } from '@pandino/pandino';

export interface BundleNodeData {
  bundle: Bundle;
  label: string;
  version: string;
  state: string;
  id: number;
}

export const BundleNode = memo(({ data }: NodeProps) => {
  const { label, version, state, id } = data as unknown as BundleNodeData;

  const stateClass = state.toLowerCase();

  return (
    <div className={`custom-node bundle-node bundle-${stateClass}`}>
      {createElement(Handle as any, { type: 'target', position: Position.Top })}

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

      {createElement(Handle as any, { type: 'source', position: Position.Bottom })}
    </div>
  );
});

BundleNode.displayName = 'BundleNode';

