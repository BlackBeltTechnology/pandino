import { memo, useState, createElement } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import type { ServiceReference } from '@pandino/pandino';

export interface ServiceNodeData {
  serviceRef: ServiceReference<any>;
  label: string;
  id: number;
  ranking: number;
  properties: Record<string, any>;
  interfaces: string[];
  dsMetadata?: {
    isComponent: boolean;
    componentName?: string;
    componentId?: number;
    factory?: string;
    immediate?: boolean;
    configurationPolicy?: string;
    configurationPid?: string;
    references?: Array<{
      name: string;
      interface?: string;
      cardinality?: string;
      policy?: string;
      target?: string;
    }>;
  } | null;
}

export const ServiceNode = memo(({ data }: NodeProps) => {
  const { label, id, ranking, properties, interfaces, dsMetadata } = data as unknown as ServiceNodeData;
  const [expanded, setExpanded] = useState(false);

  const isComponent = dsMetadata?.isComponent || false;
  const isMissing = (data as any).isMissing || false;
  const hasIssues = (data as any).hasIssues || false;

  if (isMissing) {
    // Render missing service placeholder
    return (
      <div className="custom-node service-node node-missing">
        {createElement(Handle as any, { type: 'target', position: Position.Top })}

        <div className="node-header">
          <div className="node-icon">⚠️</div>
          <div className="node-title" style={{ color: '#d32f2f', fontStyle: 'italic' }}>
            {label}
          </div>
        </div>

        <div className="node-body">
          <div className="node-field">
            <span className="node-badge" style={{ background: '#f44336', color: 'white' }}>
              MISSING SERVICE
            </span>
          </div>
          <div className="node-field" style={{ fontSize: '10px', color: '#d32f2f' }}>
            No service provides this interface
          </div>
        </div>

        {createElement(Handle as any, { type: 'source', position: Position.Bottom })}
      </div>
    );
  }

  return (
    <div className={`custom-node service-node ${isComponent ? 'ds-component' : ''} ${hasIssues ? 'node-has-issues' : ''}`}>
      {createElement(Handle as any, { type: 'target', position: Position.Top })}

      <div className="node-header" onClick={() => setExpanded(!expanded)}>
        <div className="node-icon">{isComponent ? '🔷' : '⚙️'}</div>
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

        {isComponent && dsMetadata && (
          <>
            <div className="node-field">
              <span className="node-badge badge-component">DS Component</span>
            </div>
            {dsMetadata.componentName && (
              <div className="node-field">
                <span className="node-label">Component:</span>
                <span className="node-value">{dsMetadata.componentName}</span>
              </div>
            )}
            {dsMetadata.factory && (
              <div className="node-field">
                <span className="node-badge badge-factory">Factory</span>
              </div>
            )}
            {dsMetadata.immediate && (
              <div className="node-field">
                <span className="node-badge badge-immediate">Immediate</span>
              </div>
            )}
            {dsMetadata.configurationPolicy && (
              <div className="node-field">
                <span className="node-label">Config:</span>
                <span className="node-value">{dsMetadata.configurationPolicy}</span>
              </div>
            )}
          </>
        )}

        {interfaces.length > 1 && (
          <div className="node-field">
            <span className="node-label">Interfaces:</span>
            <div className="node-interfaces">
              {interfaces.slice(1).map((iface: string, idx: number) => (
                <span key={idx} className="interface-badge">{iface}</span>
              ))}
            </div>
          </div>
        )}

        {expanded && (
          <>
            {isComponent && dsMetadata?.references && dsMetadata.references.length > 0 && (
              <div className="node-references">
                <div className="node-label">References:</div>
                {dsMetadata.references.map((ref, idx) => (
                  <div key={idx} className="reference-item">
                    <div className="reference-name">
                      {ref.name}
                      {ref.cardinality && (
                        <span className="reference-cardinality">[{ref.cardinality}]</span>
                      )}
                    </div>
                    <div className="reference-interface">{ref.interface}</div>
                    {ref.policy && (
                      <div className="reference-policy">Policy: {ref.policy}</div>
                    )}
                    {ref.target && (
                      <div className="reference-target">Target: {ref.target}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="node-properties">
              <div className="node-label">Properties:</div>
              {Object.entries(properties)
                .filter(([key]) => !['service.id', 'objectClass', 'service.ranking', 'component.name', 'component.id', 'component.factory', 'component.immediate', 'component.configuration.policy', 'component.configuration.pid'].includes(key))
                .filter(([key]) => !key.startsWith('component.reference.'))
                .map(([key, value]) => (
                  <div key={key} className="property-item">
                    <span className="property-key">{key}:</span>
                    <span className="property-value">{JSON.stringify(value)}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {createElement(Handle as any, { type: 'source', position: Position.Bottom })}
    </div>
  );
});

ServiceNode.displayName = 'ServiceNode';

