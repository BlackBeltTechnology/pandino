import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { ServiceReference } from '@pandino/pandino';

export interface ServiceNodeData {
  serviceRef: ServiceReference<any>;
  label: string;
  id: number;
  ranking: number;
  properties: Record<string, any>;
  interfaces: string[];
}

export const ServiceNode = memo(({ data }: NodeProps<ServiceNodeData>) => {
  const { label, id, ranking, properties, interfaces } = data;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="custom-node service-node">
      <Handle type="target" position={Position.Top} />

      <div className="node-header" onClick={() => setExpanded(!expanded)}>
        <div className="node-icon">⚙️</div>
        <div className="node-title">{label}</div>
        <button className="node-expand">{expanded ? '▼' : '▶'}</button>
      </div>

      <div className="node-body">
        <div className="node-field">
          <span className="node-label">ID:</span>
          <span className="node-value">{id}</span>
        </div>
        <div className="node-field">
          <span className="node-label">Ranking:</span>
          <span className="node-value">{ranking}</span>
        </div>

        {interfaces.length > 1 && (
          <div className="node-field">
            <span className="node-label">Interfaces:</span>
            <div className="node-interfaces">
              {interfaces.slice(1).map((iface, idx) => (
                <span key={idx} className="interface-badge">{iface}</span>
              ))}
            </div>
          </div>
        )}

        {expanded && (
          <div className="node-properties">
            <div className="node-label">Properties:</div>
            {Object.entries(properties)
              .filter(([key]) => !['service.id', 'objectClass', 'service.ranking'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="property-item">
                  <span className="property-key">{key}:</span>
                  <span className="property-value">{JSON.stringify(value)}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

ServiceNode.displayName = 'ServiceNode';

